import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface Message { 
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModelInfo {
  'general.name'?: string;
  'general.architecture'?: string;
  'gemma3n.context_length'?: string;
  'gemma3n.embedding_length'?: string;
  'gemma3n.block_count'?: string;
  'gemma3n.attention.head_count'?: string;
  'llama.context_length'?: string;
  'llama.embedding_length'?: string;
  'llama.block_count'?: string;
  'llama.attention.head_count'?: string;
  data_offset?: number;
  size?: number;
}

interface LlamaContext {
  completion: (params: any, callback?: (data: any) => void) => Promise<any>;
  tokenize: (content: string) => Promise<any>;
  detokenize: (tokens: number[]) => Promise<string>;
  release: () => Promise<void>;
}

const STOP_WORDS = [
  '<end_of_turn>', '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', 
  '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
  '<|end_of_turn|>', '<|endoftext|>'
];

const MODEL_CONFIG = {
  use_mlock: true,
  n_ctx: 32768, // Gemma 3n supports 32K context
  n_gpu_layers: 99,
  temperature: 1.0,
  top_k: 64,
  top_p: 0.95,
  min_p: 0.0,
};

export default function LlamaTestScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // States
  const [modelPath, setModelPath] = useState('/Users/earlpotters/Documents/ai-projects/relay-responder-app/models/gemma-3n-E2B-it-Q4_K_M.gguf');
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // Utility functions
  const getModelInfoValue = (info: ModelInfo | null, key: keyof ModelInfo, fallback = 'Unknown'): string => {
    if (!info) return fallback;
    const value = info[key];
    if (!value) return fallback;
    
    // Only parse numeric fields, leave string fields as-is
    const numericFields = [
      'llama.context_length', 'llama.embedding_length', 'llama.block_count', 'llama.attention.head_count',
      'gemma3n.context_length', 'gemma3n.embedding_length', 'gemma3n.block_count', 'gemma3n.attention.head_count'
    ];
    
    if (typeof value === 'string' && numericFields.includes(key)) {
      const parsed = parseInt(value);
      return isNaN(parsed) ? fallback : parsed.toLocaleString();
    }
    
    return value.toString();
  };

  const getModelSize = (info: ModelInfo | null): string => {
    if (!info) return 'Unknown';
    if (info.size) return (info.size / 1024 / 1024).toFixed(1) + ' MB';
    if (info.data_offset) return (info.data_offset / 1024 / 1024).toFixed(1) + ' MB (est.)';
    return 'Unknown';
  };

  // Helper function to get model info with fallback to both Gemma 3n and LLaMA properties
  const getModelInfoWithFallback = (info: ModelInfo | null, gemma3nKey: keyof ModelInfo, llamaKey: keyof ModelInfo): string => {
    if (!info) return 'Unknown';
    
    // Try Gemma 3n property first, then LLaMA property
    const gemma3nValue = getModelInfoValue(info, gemma3nKey);
    if (gemma3nValue !== 'Unknown') return gemma3nValue;
    
    return getModelInfoValue(info, llamaKey);
  };

  const handleModelAction = async (action: 'info' | 'load' | 'release') => {
    if (!modelPath.trim() && action !== 'release') {
      Alert.alert('Error', 'Please enter a model path');
      return;
    }

    try {
      setIsLoadingModel(true);

      switch (action) {
        case 'info':
          const info = await loadLlamaModelInfo(modelPath);
          setModelInfo(info || null);
          Alert.alert('Success', 'Model info loaded successfully');
          break;

        case 'load':
          if (context) {
            await context.release();
            setContext(null);
            setIsModelLoaded(false);
          }
          
          const newContext = await initLlama({ model: modelPath, ...MODEL_CONFIG });
          setContext(newContext);
          setIsModelLoaded(true);
          
          if (!modelInfo) {
            try {
              const autoInfo = await loadLlamaModelInfo(modelPath);
              setModelInfo(autoInfo || null);
            } catch (error) {
              console.warn('Could not auto-load model info:', error);
            }
          }
          
          Alert.alert('Success', 'Model loaded successfully');
          break;

        case 'release':
          if (context) {
            await context.release();
            setContext(null);
            setIsModelLoaded(false);
            setModelInfo(null);
            Alert.alert('Success', 'Model released successfully');
          }
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to ${action} model: ${errorMessage}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !context || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputMessage('');
    setIsGenerating(true);
    setCurrentResponse('');

    try {
      // Format conversation using Gemma 3n chat template
      let conversationText = '<bos>';
      
      // Add system message
      conversationText += '<start_of_turn>system\nYou are a helpful AI assistant. Respond clearly and concisely.<end_of_turn>\n';
      
      // Add conversation history
      messages.forEach(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        conversationText += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
      });
      
      // Add current user message
      conversationText += `<start_of_turn>user\n${inputMessage.trim()}<end_of_turn>\n`;
      
      // Start model response
      conversationText += '<start_of_turn>model\n';

      await context.completion(
        {
          prompt: conversationText,
          n_predict: 200,
          stop: STOP_WORDS,
          stream: true,
          ...MODEL_CONFIG,
        },
        (data) => {
          if (data.token) {
            setCurrentResponse(prev => prev + data.token);
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: msg.content + data.token }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      Alert.alert('Error', `Failed to send message: ${error}`);
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setIsGenerating(false);
      setCurrentResponse('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse('');
  };

  // Effects
  useEffect(() => {
    return () => {
      if (context) {
        context.release().catch(console.error);
      }
    };
  }, [context]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const modelInfoItems = [
    { label: 'Model', value: getModelInfoValue(modelInfo, 'general.name') },
    { label: 'Architecture', value: getModelInfoValue(modelInfo, 'general.architecture') },
    { label: 'Context Length', value: getModelInfoWithFallback(modelInfo, 'gemma3n.context_length' as keyof ModelInfo, 'llama.context_length') },
    { label: 'Embedding Size', value: getModelInfoWithFallback(modelInfo, 'gemma3n.embedding_length' as keyof ModelInfo, 'llama.embedding_length') },
    { label: 'Layers', value: getModelInfoWithFallback(modelInfo, 'gemma3n.block_count' as keyof ModelInfo, 'llama.block_count') },
    { label: 'Attention Heads', value: getModelInfoWithFallback(modelInfo, 'gemma3n.attention.head_count' as keyof ModelInfo, 'llama.attention.head_count') },
    { label: 'File Size', value: getModelSize(modelInfo) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gemma 3n Test</Text>
          <TouchableOpacity onPress={clearChat}>
            <MaterialIcons name="clear" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Model Section */}
        <View style={styles.modelSection}>
          <View style={styles.modelHeader}>
            <Text style={styles.sectionTitle}>Model Configuration</Text>
            <TouchableOpacity 
              onPress={() => setShowModelInfo(!showModelInfo)}
              style={styles.toggleButton}
            >
              <MaterialIcons 
                name={showModelInfo ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Model Status */}
          <View style={styles.modelStatusBar}>
            <View style={styles.modelStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: isModelLoaded ? '#34C759' : '#666' }]} />
              <Text style={styles.statusText}>
                {isModelLoaded ? 'Model Loaded' : 'Model Not Loaded'}
              </Text>
            </View>
            {modelInfo && (
              <Text style={styles.modelSizeText}>
                {getModelSize(modelInfo)}
              </Text>
            )}
          </View>

          {/* Collapsible Controls */}
          {showModelInfo && (
            <View style={styles.modelControls}>
              <TextInput
                style={styles.pathInput}
                placeholder="Enter model path (e.g., /path/to/model.gguf)"
                placeholderTextColor="#888"
                value={modelPath}
                onChangeText={setModelPath}
                editable={!isLoadingModel}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.infoButton]}
                  onPress={() => handleModelAction('info')}
                  disabled={isLoadingModel}
                >
                  {isLoadingModel ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Load Info</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, isModelLoaded ? styles.releaseButton : styles.loadButton]}
                  onPress={() => handleModelAction(isModelLoaded ? 'release' : 'load')}
                  disabled={isLoadingModel}
                >
                  {isLoadingModel ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isModelLoaded ? 'Release' : 'Load Model'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Model Info */}
              {modelInfo && (
                <View style={styles.modelInfoGrid}>
                  {modelInfoItems.map((item, index) => (
                    <View key={index} style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{item.label}:</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Chat Interface</Text>
          
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text style={styles.messageRole}>
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </Text>
                <Text style={styles.messageContent}>{message.content}</Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={1000}
              editable={!isGenerating && isModelLoaded}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputMessage.trim() || !isModelLoaded || isGenerating) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || !isModelLoaded || isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modelSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    padding: 5,
  },
  modelStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  modelSizeText: {
    color: '#aaa',
    fontSize: 12,
  },
  modelControls: {
    paddingBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pathInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    backgroundColor: '#007AFF',
  },
  loadButton: {
    backgroundColor: '#34C759',
  },
  releaseButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modelInfoGrid: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  chatSection: {
    flex: 1,
    padding: 20,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 15,
  },
  messageContainer: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#2a2a2a',
    alignSelf: 'flex-start',
  },
  messageRole: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  messageContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 5,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
}); 