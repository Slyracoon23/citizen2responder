import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

// --- Types ---
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

// --- Constants ---
const STOP_WORDS = [
  '<end_of_turn>', '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', 
  '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
  '<|end_of_turn|>', '<|endoftext|>'
];

const MODEL_CONFIG = {
  use_mlock: true,
  n_ctx: 32768,
  n_gpu_layers: 99,
  temperature: 1.0,
  top_k: 64,
  top_p: 0.95,
  min_p: 0.0,
};

const MODEL_PATH = '/Users/earlpotters/Documents/ai-projects/relay-responder-app/models/gemma-3n-E2B-it-Q4_K_M.gguf';

// --- Custom Hook for Permissions ---
function usePermission(requestAsync: () => Promise<{ status: string }>) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      const { status } = await requestAsync();
      setHasPermission(status === 'granted');
    })();
  }, [requestAsync]);
  const requestPermission = useCallback(async () => {
    const { status } = await requestAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, [requestAsync]);
  return [hasPermission, requestPermission] as const;
}

// --- Overlay Components ---
type LocationOverlayProps = {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
};
const LocationOverlay = ({ isLocationOn, isLocationLoading, currentLocation, rotateAnim }: LocationOverlayProps) => (
  isLocationOn ? (
    <View style={styles.locationOverlay}>
      <View style={styles.locationIndicator}>
        {isLocationLoading ? (
          <Animated.View style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          }}>
            <MaterialIcons name="hourglass-empty" size={16} color="#FF9F0A" />
          </Animated.View>
        ) : (
          <MaterialIcons name="location-on" size={16} color="#34C759" />
        )}
        <Text style={styles.locationText}>
          {isLocationLoading
            ? "Getting location..."
            : currentLocation
              ? `Location: ${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`
              : "Location enabled"
          }
        </Text>
      </View>
    </View>
  ) : null
);

type QuestionPopoverProps = {
  isQuestionToggleOn: boolean;
  slideAnim: Animated.Value;
  currentQuestion: string;
  handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
};
const QuestionPopover = ({ isQuestionToggleOn, slideAnim, currentQuestion, handleQuestionResponse }: QuestionPopoverProps) => (
  isQuestionToggleOn ? (
    <Animated.View style={[
      styles.questionOverlay,
      {
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [200, 0],
          })
        }]
      }
    ]}>
      <View style={styles.questionPopover}>
        <Text style={styles.questionText}>{currentQuestion}</Text>
        <View style={styles.responseButtons}>
          <View style={styles.topButtonRow}>
            <TouchableOpacity
              style={styles.responseButton}
              onPress={() => handleQuestionResponse('no')}
            >
              <Text style={styles.responseButtonText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={() => handleQuestionResponse('yes')}
            >
              <Text style={styles.responseButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.cantTellButton}
            onPress={() => handleQuestionResponse('dont-know')}
          >
            <Text style={styles.responseButtonText}>Can&apos;t Tell</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  ) : null
);

// --- Combined Overlays Component ---
// This component will be defined inside VideoCallScreen function to have proper access to ChatOverlay

// --- Toggle Button Component ---
type ToggleButtonProps = {
  isOn: boolean;
  onPress: () => void;
  iconOn: keyof typeof MaterialIcons.glyphMap;
  iconOff: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isLoading?: boolean;
  rotateAnim?: Animated.Value;
  pulseAnim?: Animated.Value;
  isEndButton?: boolean;
};
const ToggleButton = ({ 
  isOn, 
  onPress, 
  iconOn, 
  iconOff, 
  label, 
  isLoading, 
  rotateAnim, 
  pulseAnim,
  isEndButton 
}: ToggleButtonProps) => (
  <TouchableOpacity style={styles.controlButton} onPress={onPress}>
    <View style={[
      isEndButton ? styles.endCallButton : styles.buttonBackground,
      !isOn && !isEndButton && styles.buttonBackgroundOff
    ]}>
      {isLoading && rotateAnim ? (
        <Animated.View style={{
          transform: [{
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }],
        }}>
          <MaterialIcons 
            name="hourglass-empty" 
            size={24} 
            color={isOn && !isEndButton ? "#000" : "white"} 
          />
        </Animated.View>
      ) : pulseAnim ? (
        <Animated.View style={{
          transform: [{ scale: pulseAnim }],
        }}>
          <MaterialIcons 
            name={isOn ? iconOn : iconOff} 
            size={24} 
            color={isOn && !isEndButton ? "#000" : "white"} 
          />
        </Animated.View>
      ) : (
        <MaterialIcons 
          name={isOn ? iconOn : iconOff} 
          size={24} 
          color={isOn && !isEndButton ? "#000" : "white"} 
        />
      )}
    </View>
    <Text style={styles.buttonLabel}>{label}</Text>
  </TouchableOpacity>
);

type ToggleFeatureOptions = {
  isOn: boolean;
  setIsOn: (on: boolean) => void;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  alertTitle: string;
  alertMessage: string;
};

async function handleToggleFeature({
  isOn,
  setIsOn,
  hasPermission,
  requestPermission,
  onEnable,
  onDisable,
  alertTitle,
  alertMessage,
}: ToggleFeatureOptions) {
  if (!isOn) {
    if (hasPermission === false) {
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsOn(false) },
          {
            text: 'Settings',
            onPress: async () => {
              const granted = await requestPermission();
              if (granted) {
                if (onEnable) await onEnable();
                setIsOn(true);
              } else {
                setIsOn(false);
              }
            },
          },
        ]
      );
      return;
    }
    if (hasPermission === null) {
      const granted = await requestPermission();
      if (granted) {
        if (onEnable) await onEnable();
        setIsOn(true);
      } else {
        setIsOn(false);
      }
      return;
    }
    if (hasPermission === true) {
      if (onEnable) await onEnable();
      setIsOn(true);
    }
  } else {
    if (onDisable) await onDisable();
    setIsOn(false);
  }
}

export default function VideoCallScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(true);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [isQuestionToggleOn, setIsQuestionToggleOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  
  const [hasPermission, requestCameraPermission] = usePermission(Camera.requestCameraPermissionsAsync);
  const [hasAudioPermission, requestAudioPermission] = usePermission(Audio.requestPermissionsAsync);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const {
    transcript,
    interimTranscript,
    errorMessage: sttError,
    recognizing,
    recognitionState,
    stop: stopSpeech,
    clear: clearSpeech,
    permissionStatus: sttPermissionStatus,
    checkPermissions: checkSttPermissions,
    checkAndRequestPermissions: checkAndRequestSttPermissions,
  } = useSpeechToText();

  // Custom start function with continuous recognition
  const startContinuousSpeech = async () => {
    try {
      const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!isAvailable) {
        console.error('Speech recognition is not available on this device');
        return false;
      }
      
      const hasPermissions = await checkAndRequestSttPermissions();
      if (!hasPermissions) {
        console.error('Speech recognition permissions not granted');
        return false;
      }

      console.log('Starting continuous speech recognition...');
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true, // Enable continuous recognition
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to start continuous speech recognition:', error);
      return false;
    }
  };

  // Removed VAD - using only speech-to-text for voice detection

  // Conversation history state
  interface ConversationMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: number;
  }
  
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isGemmaLoading, setIsGemmaLoading] = useState(false);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const prevTranscript = useRef('');
  const lastProcessedLength = useRef(0);
  
  // Speech end detection
  const speechEndTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInterimTime = useRef<number>(0);
  const speechEndTimeout = 1500; // 1.5 seconds of silence before triggering AI

  // Gemma model state
  const [gemmaContext, setGemmaContext] = useState<LlamaContext | null>(null);
  const [isGemmaModelLoaded, setIsGemmaModelLoaded] = useState(false);
  const [isInitializingGemma, setIsInitializingGemma] = useState(false);

  // Initialize Gemma model
  const initializeGemmaModel = async () => {
    if (isInitializingGemma || isGemmaModelLoaded) return;
    
    try {
      setIsInitializingGemma(true);
      console.log('Initializing Gemma model...');
      
      // Release existing context if any
      if (gemmaContext) {
        await gemmaContext.release();
        setGemmaContext(null);
        setIsGemmaModelLoaded(false);
      }
      
      const newContext = await initLlama({ model: MODEL_PATH, ...MODEL_CONFIG });
      setGemmaContext(newContext);
      setIsGemmaModelLoaded(true);
      
      console.log('Gemma model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemma model:', error);
      setGemmaContext(null);
      setIsGemmaModelLoaded(false);
    } finally {
      setIsInitializingGemma(false);
    }
  };

  // Run actual Gemma inference
  async function runGemmaLocally(text: string): Promise<string> {
    // Fallback to mock response if model not loaded
    if (!gemmaContext || !isGemmaModelLoaded) {
      console.log('Gemma model not loaded, attempting to initialize...');
      await initializeGemmaModel();
      
      // If still not loaded after initialization attempt, return fallback
      if (!gemmaContext || !isGemmaModelLoaded) {
        console.log('Gemma model initialization failed, using fallback response');
        await new Promise(res => setTimeout(res, 500));
        return `AI Assistant: I'm having trouble accessing the local model. You said: "${text}"`;
      }
    }

    try {
      // Format conversation using Gemma 3n chat template
      let conversationText = '<bos>';
      
      // Add system message
      conversationText += '<start_of_turn>system\nYou are a helpful AI assistant for emergency medical situations. Keep your responses very short - maximum 1-2 sentences. Be direct, clear, and concise. Do not provide long explanations.<end_of_turn>\n';
      
      // Add current user message
      conversationText += `<start_of_turn>user\n${text.trim()}<end_of_turn>\n`;
      
      // Start model response
      conversationText += '<start_of_turn>model\n';

      let fullResponse = '';
      
      await gemmaContext.completion(
        {
          prompt: conversationText,
          n_predict: 150,
          stop: STOP_WORDS,
          stream: true,
          ...MODEL_CONFIG,
        },
        (data) => {
          if (data.token) {
            fullResponse += data.token;
          }
        }
      );

      // Clean up response by removing any stop words that might have leaked through
      for (const stopWord of STOP_WORDS) {
        fullResponse = fullResponse.replace(stopWord, '');
      }

      return fullResponse.trim() || 'I understand what you said, but I need a moment to process it properly.';
    } catch (error) {
      console.error('Gemma inference error:', error);
      return `AI Assistant: I encountered an issue processing your message: "${text}". Please try again.`;
    }
  }

  // Helper function to clear speech end timer
  const clearSpeechEndTimer = useCallback(() => {
    if (speechEndTimer.current) {
      clearTimeout(speechEndTimer.current);
      speechEndTimer.current = null;
    }
  }, []);

  // Conversation history management functions
  const addUserMessage = useCallback((content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added user message:', content);
    return message.id;
  }, []);

  const addAiMessage = useCallback((content: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'ai', 
      content: content.trim(),
      timestamp: Date.now()
    };
    setConversationHistory(prev => [...prev, message]);
    console.log('🔍 CONV DEBUG: Added AI message:', content);
    return message.id;
  }, []);


  // Position-based diffing to extract new speech content
  const getNewSpeechContent = useCallback((fullTranscript: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 DIFF DEBUG [${timestamp}]: fullTranscript:`, `"${fullTranscript}"`);
    console.log(`🔍 DIFF DEBUG [${timestamp}]: lastProcessedLength:`, lastProcessedLength.current);
    console.log(`🔍 DIFF DEBUG [${timestamp}]: prevTranscript:`, `"${prevTranscript.current}"`);
    
    // Normalize the transcript
    const normalizedTranscript = fullTranscript.replace(/\s+/g, ' ').trim();
    
    // Simple position-based approach
    let newContent = '';
    
    if (lastProcessedLength.current === 0) {
      // First time processing any transcript
      newContent = normalizedTranscript;
      console.log(`🔍 DIFF DEBUG [${timestamp}]: First transcript case`);
    } else if (normalizedTranscript.length > lastProcessedLength.current) {
      // Extract content after the last processed position
      newContent = normalizedTranscript.slice(lastProcessedLength.current).trim();
      console.log(`🔍 DIFF DEBUG [${timestamp}]: Position-based extraction from ${lastProcessedLength.current}`);
    } else if (normalizedTranscript === prevTranscript.current) {
      // Exact same as previous - no new content
      newContent = '';
      console.log(`🔍 DIFF DEBUG [${timestamp}]: Identical to previous transcript`);
    } else {
      // Different transcript but not longer - treat as new (speech recognition restart)
      newContent = normalizedTranscript;
      console.log(`🔍 DIFF DEBUG [${timestamp}]: Different transcript - treating as new`);
      // Reset the position counter for new speech session
      lastProcessedLength.current = 0;
    }
    
    console.log(`🔍 DIFF DEBUG [${timestamp}]: Final extracted newContent:`, `"${newContent}"`);
    return newContent;
  }, []);

  // Helper function to trigger AI response with smart diffing
  const triggerAIResponse = useCallback((finalTranscript: string) => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 DEBUG [${timestamp}]: triggerAIResponse called with:`, finalTranscript);
    
    // Prevent multiple simultaneous processing
    if (isProcessingTranscript) {
      console.log(`❌ DEBUG [${timestamp}]: Already processing transcript, skipping`);
      return;
    }
    
    setIsProcessingTranscript(true);
    
    try {
      // Use position-based diffing to extract only new content
      const newContent = getNewSpeechContent(finalTranscript);
      
      // Only proceed if we have meaningful new content
      if (!newContent || newContent.length < 2) {
        console.log(`❌ DEBUG [${timestamp}]: No meaningful new content to process:`, newContent);
        return;
      }
      
      // Check if this exact content was already processed
      if (newContent === prevTranscript.current) {
        console.log(`❌ DEBUG [${timestamp}]: Content already processed:`, newContent);
        return;
      }
      
      // Additional safeguard: check if this content already exists in conversation history
      const existingUserMessage = conversationHistory
        .filter(msg => msg.type === 'user')
        .find(msg => msg.content.trim() === newContent.trim());
      
      if (existingUserMessage) {
        console.log(`❌ DEBUG [${timestamp}]: Content already exists in conversation history:`, newContent);
        return;
      }
      
      console.log(`✅ [${timestamp}] Triggering AI response for NEW content:`, newContent);
      
      // Update tracking variables IMMEDIATELY to prevent race conditions
      const normalizedTranscript = finalTranscript.replace(/\s+/g, ' ').trim();
      lastProcessedLength.current = normalizedTranscript.length;
      prevTranscript.current = newContent;
    
      // Clear speech end timer
      clearSpeechEndTimer();
      
      // Add user message to conversation history
      addUserMessage(newContent);
      
      setIsGemmaLoading(true);
      runGemmaLocally(newContent)
        .then(res => {
          console.log(`🔍 DEBUG [${timestamp}]: AI response received:`, res);
          
          // Add AI response to conversation history
          addAiMessage(res);
          
          // Clear transcript state (the history is preserved in conversationHistory)
          clearSpeech();
          
          console.log(`🔍 DEBUG [${timestamp}]: Response added to history, speech cleared`);
          
          // Auto-clear after showing for 3 seconds (history remains)
          setTimeout(() => {
            console.log(`🔍 DEBUG [${timestamp}]: Ready for next conversation input`);
            // Speech recognition continues automatically (continuous mode)
          }, 3000);
        })
        .catch(error => {
          console.log(`🔍 DEBUG [${timestamp}]: AI error occurred:`, error);
          addAiMessage('Error running Gemma locally.');
          
          // Clear transcript state even on error
          clearSpeech();
          
          // Auto-clear error message
          setTimeout(() => {
            console.log(`🔍 DEBUG [${timestamp}]: Ready for next input after error`);
          }, 3000);
        })
        .finally(() => {
          setIsGemmaLoading(false);
          setIsProcessingTranscript(false);
        });
        
    } catch (error) {
      console.error(`🔍 ERROR [${timestamp}]: Exception in triggerAIResponse:`, error);
      setIsProcessingTranscript(false);
    }
    
  }, [getNewSpeechContent, clearSpeechEndTimer, addUserMessage, addAiMessage, runGemmaLocally, clearSpeech]);

  // Effect: Monitor interim transcript changes to detect speech activity
  useEffect(() => {
    console.log('🔍 DEBUG: Speech monitoring effect triggered');
    console.log('🔍 DEBUG: interimTranscript:', interimTranscript);
    console.log('🔍 DEBUG: transcript:', transcript);
    console.log('🔍 DEBUG: prevTranscript.current:', prevTranscript.current);
    
    const now = Date.now();
    
    if (interimTranscript && interimTranscript.trim()) {
      // User is actively speaking - reset timer
      console.log('🎤 Speech activity detected:', interimTranscript);
      lastInterimTime.current = now;
      clearSpeechEndTimer();
      
      // Start new timer for speech end detection
      speechEndTimer.current = setTimeout(() => {
        console.log('⏰ Speech ended, checking for final transcript');
        const currentTranscript = transcript || interimTranscript;
        console.log('🔍 DEBUG: currentTranscript for AI trigger:', currentTranscript);
        if (currentTranscript && currentTranscript.trim()) {
          triggerAIResponse(currentTranscript);
        }
      }, speechEndTimeout);
    } else if (transcript && transcript.trim() && !interimTranscript) {
      // We have final transcript but no interim (speech likely ended)
      console.log('📝 Final transcript without interim, starting end timer');
      console.log('🔍 DEBUG: Final transcript value:', transcript);
      clearSpeechEndTimer();
      
      speechEndTimer.current = setTimeout(() => {
        console.log('⏰ Speech end timeout reached');
        console.log('🔍 DEBUG: About to trigger AI with transcript:', transcript);
        triggerAIResponse(transcript);
      }, speechEndTimeout);
    }
  }, [interimTranscript, transcript, triggerAIResponse, clearSpeechEndTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearSpeechEndTimer();
    };
  }, [clearSpeechEndTimer]);

  // Move ChatOverlay definition here so it has access to the above variables
  const ChatOverlay = ({ isTranscriptionEnabled }: { isTranscriptionEnabled: boolean }) => (
    isTranscriptionEnabled ? (
      <View style={styles.chatOverlay}>
        {/* Conversation History */}
        {conversationHistory.length > 0 ? (
          <View style={{ maxHeight: 300 }}>
            {conversationHistory.slice(-4).map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.chatBubble, 
                  { 
                    backgroundColor: message.type === 'user' ? '#007AFF' : '#222', 
                    marginTop: 5,
                    marginBottom: 5,
                    alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }
                ]}
              >
                <Text style={[
                  styles.chatText, 
                  { color: message.type === 'user' ? '#FFF' : '#FFD600', fontSize: 14 }
                ]}>
                  {message.content}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          /* Welcome message when no conversation history */
          <View style={[styles.chatBubble, { alignSelf: 'center' }]}>
            <Text style={styles.chatText}>
              Start speaking - I'm listening!
            </Text>
          </View>
        )}

        {/* Loading states and speech recognition status - positioned below messages */}
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          {/* Loading states */}
          {isInitializingGemma ? (
            <Text style={{ color: '#FF9F0A', marginBottom: 8 }}>Initializing AI model...</Text>
          ) : isGemmaLoading ? (
            <Text style={{ color: '#34C759', marginBottom: 8 }}>AI is thinking...</Text>
          ) : !isGemmaModelLoaded ? (
            <Text style={{ color: '#FF3B30', fontSize: 12, marginBottom: 8 }}>AI model not ready</Text>
          ) : null}

          {/* Speech recognition status */}
          <Text style={{ color: interimTranscript ? '#FF9F0A' : (recognizing ? '#34C759' : '#8E8E93'), fontSize: 12, fontWeight: '500', backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
            {interimTranscript ? 'Voice Detected!' :
             recognitionState === 'starting' ? 'Starting...' : 
             recognitionState === 'recognizing' ? 'Listening...' : 
             recognitionState === 'stopping' ? 'Stopping...' : 'Initializing...'}
          </Text>

          {/* Error message */}
          {sttError ? (
            <Text style={{ color: '#FF3B30', marginTop: 8, textAlign: 'center' }}>{sttError}</Text>
          ) : null}
        </View>
      </View>
    ) : null
  );

  // AllOverlaysProps type and AllOverlays component definition here
  type AllOverlaysProps = {
    isLocationOn: boolean;
    isLocationLoading: boolean;
    currentLocation: Location.LocationObject | null;
    rotateAnim: Animated.Value;
    isTranscriptionEnabled: boolean;
    isQuestionToggleOn: boolean;
    slideAnim: Animated.Value;
    currentQuestion: string;
    handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
  };

  const AllOverlays = (props: AllOverlaysProps) => (
    <>
      <LocationOverlay 
        isLocationOn={props.isLocationOn} 
        isLocationLoading={props.isLocationLoading} 
        currentLocation={props.currentLocation} 
        rotateAnim={props.rotateAnim} 
      />
      <ChatOverlay isTranscriptionEnabled={props.isTranscriptionEnabled} />
      <QuestionPopover 
        isQuestionToggleOn={props.isQuestionToggleOn} 
        slideAnim={props.slideAnim} 
        currentQuestion={props.currentQuestion} 
        handleQuestionResponse={props.handleQuestionResponse} 
      />
    </>
  );

  // Animation effects
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isQuestionToggleOn ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isQuestionToggleOn, slideAnim]);

  useEffect(() => {
    if (isLocationLoading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isLocationLoading, rotateAnim]);

  useEffect(() => {
    const requestAndFetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This feature requires location access. Please enable it in your device settings.',
          [{ text: 'OK', onPress: () => setIsLocationOn(false) }]
        );
        setIsLocationOn(false);
        setIsLocationLoading(false);
        return;
      }
      await getCurrentLocation();
    };

    requestAndFetchLocation();
  }, []);

  // Initialize Gemma model and auto-start speech recognition on component mount
  useEffect(() => {
    // Initialize model when component mounts
    initializeGemmaModel();

    // Auto-start speech recognition after a short delay
    const autoStartSpeech = async () => {
      try {
        // Wait a bit for component to fully mount and permissions to be checked
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Auto-starting continuous speech recognition...');
        const success = await startContinuousSpeech();
        if (success) {
          console.log('Continuous speech recognition auto-started successfully');
        } else {
          console.log('Failed to auto-start continuous speech recognition');
        }
      } catch (error) {
        console.error('Error auto-starting speech recognition:', error);
      }
    };

    autoStartSpeech();

    // Cleanup function to release context when component unmounts
    return () => {
      if (gemmaContext) {
        console.log('Cleaning up Gemma context...');
        gemmaContext.release().catch(console.error);
      }
      // Stop speech recognition on cleanup
      try {
        stopSpeech();
      } catch (error) {
        console.error('Error stopping speech recognition on cleanup:', error);
      }
    };
  }, []);

  // Additional cleanup effect to handle context changes
  useEffect(() => {
    return () => {
      if (gemmaContext) {
        gemmaContext.release().catch(console.error);
      }
    };
  }, [gemmaContext]);

  const handleEndCall = async () => {
    // Cleanup Gemma context before ending call
    if (gemmaContext) {
      try {
        console.log('Releasing Gemma context on call end...');
        await gemmaContext.release();
        setGemmaContext(null);
        setIsGemmaModelLoaded(false);
      } catch (error) {
        console.error('Error releasing Gemma context:', error);
      }
    }
    router.back();
  };

  const handleCamera = async () => {
    await handleToggleFeature({
      isOn: isCameraOn,
      setIsOn: setIsCameraOn,
      hasPermission: hasPermission,
      requestPermission: requestCameraPermission,
      alertTitle: 'Camera Permission Required',
      alertMessage: 'Please enable camera access in your device settings to use this feature.',
    });
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      setIsLocationLoading(false);
      console.log('Current location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setIsLocationLoading(false);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK', onPress: () => setIsLocationOn(false) }]
      );
    }
  };

  const handleVoice = async () => {
    await handleToggleFeature({
      isOn: isVoiceOn,
      setIsOn: setIsVoiceOn,
      hasPermission: hasAudioPermission,
      requestPermission: requestAudioPermission,
      onEnable: async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          });
          console.log('Voice enabled - microphone is now active');
        } catch (error) {
          console.error('Failed to enable voice:', error);
          Alert.alert(
            'Voice Error',
            'Unable to enable microphone. Please try again.',
            [{ text: 'OK' }]
          );
        }
      },
      onDisable: async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
          console.log('Voice disabled - microphone is now inactive');
        } catch (error) {
          console.error('Failed to disable voice:', error);
        }
      },
      alertTitle: 'Microphone Permission Required',
      alertMessage: 'Please enable microphone access in your device settings to use voice features.',
    });
  };

  const handleToggleTranscription = () => {
    setIsTranscriptionEnabled(!isTranscriptionEnabled);
  };

  const handleQuestionToggle = () => {
    setIsQuestionToggleOn(!isQuestionToggleOn);
  };

  const handleQuestionResponse = (response: 'yes' | 'no' | 'dont-know') => {
    console.log('Question response:', response);
    setIsQuestionToggleOn(false);
  };

  // Handle permission denied case
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.permissionContent}>
          <MaterialIcons name="videocam-off" size={64} color="white" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access to use video calling features.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleEndCall}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop: insets.top }]}>
        <View style={styles.leftControls} />
        <View style={styles.liveIndicator}>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <View style={styles.rightControls}>
          <TouchableOpacity 
            style={[styles.headerToggle, isQuestionToggleOn && styles.headerToggleActive]}
            onPress={handleQuestionToggle}
          >
            <MaterialIcons 
              name="quiz" 
              size={24} 
              color={isQuestionToggleOn ? "#FF3B30" : "white"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerToggle}
            onPress={handleToggleTranscription}
          >
            <MaterialIcons 
              name={isTranscriptionEnabled ? "closed-caption" : "closed-caption-disabled"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Feed */}
      <View style={styles.videoContainer}>
        {isCameraOn && hasPermission ? (
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
        ) : (
          <View style={styles.camera}>
            <View style={styles.cameraOffOverlay}>
              <MaterialIcons name="videocam-off" size={48} color="white" />
              <Text style={styles.cameraOffText}>
                {hasPermission === null ? 'Checking camera permissions...' : 'Camera is off'}
              </Text>
            </View>
          </View>
        )}
        
        {/* All Overlays */}
        <AllOverlays 
          isLocationOn={isLocationOn}
          isLocationLoading={isLocationLoading}
          currentLocation={currentLocation}
          rotateAnim={rotateAnim}
          isTranscriptionEnabled={isTranscriptionEnabled}
          isQuestionToggleOn={isQuestionToggleOn}
          slideAnim={slideAnim}
          currentQuestion={currentQuestion}
          handleQuestionResponse={handleQuestionResponse}
        />
      </View>

      {/* Control Buttons */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
        <ToggleButton
          isOn={isCameraOn}
          onPress={handleCamera}
          iconOn="videocam"
          iconOff="videocam-off"
          label="Video"
        />
        <ToggleButton
          isOn={isVoiceOn}
          onPress={handleVoice}
          iconOn="mic"
          iconOff="mic-off"
          label="Voice"
          pulseAnim={micPulseAnim}
        />
        <ToggleButton
          isOn={false}
          onPress={handleEndCall}
          iconOn="close"
          iconOff="close"
          label="End"
          isEndButton
        />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContent: {
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#6C6C70',
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  leftControls: {
    width: 98, // Same width as rightControls (44px per button + 10px margin + 44px = 98px)
  },
  liveIndicator: {
    alignItems: 'center',
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 98, // Fixed width to match leftControls
  },
  headerToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerToggleActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  videoContainer: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraOffOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cameraOffText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  chatOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 5,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  chatBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 16,
    maxWidth: '85%',
    alignSelf: 'center',
  },
  chatText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  questionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  questionPopover: {
    backgroundColor: '#1C1C1E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  questionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  responseButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  responseButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  cantTellButton: {
    backgroundColor: '#6C6C70',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  responseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 40,
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  buttonBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonBackgroundOff: {
    backgroundColor: '#FF3B30',
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    width: '60%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  locationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 10,
    alignItems: 'center',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 8,
    alignSelf: 'center',
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  voiceOverlay: {
    position: 'absolute',
    top: 50, // Position below location indicator
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 10,
    alignItems: 'center',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 15,
    padding: 8,
    alignSelf: 'center',
  },
  voiceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 