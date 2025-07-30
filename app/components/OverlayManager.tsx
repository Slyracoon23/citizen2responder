import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConversationMessage } from '../services/apiService';
import ChatInterface from './ChatInterface';

interface AIStatusOverlayProps {
  isTranscriptionEnabled: boolean;
  isLoading: boolean;
  isImageInputEnabled: boolean;
}

const AIStatusOverlay = ({ isTranscriptionEnabled, isLoading, isImageInputEnabled }: AIStatusOverlayProps) => {
  if (!isTranscriptionEnabled) return null;

  return (
    <View style={styles.aiStatusOverlay}>
      <View style={styles.aiStatusIndicator}>
        {isLoading ? (
          <Text style={styles.processingText}>🌐 OpenRouter AI is processing...</Text>
        ) : (
          <Text style={styles.readyText}>
            {isImageInputEnabled
              ? '🌐 OpenRouter AI (Images)'
              : '🌐 OpenRouter AI (Text Only)'
            }
          </Text>
        )}
      </View>
    </View>
  );
};



interface OverlayManagerProps {
  isTranscriptionEnabled: boolean;
  isQuestionToggleOn: boolean;
  slideAnim: Animated.Value;
  
  // Chat interface props
  conversationHistory: ConversationMessage[];
  textInput: string;
  setTextInput: (text: string) => void;
  chatScrollViewRef: React.RefObject<any>;
  onSendMessage: () => void;
  isApiLoading: boolean;
  isImageInputEnabled: boolean;
}

export default function OverlayManager({
  isTranscriptionEnabled,
  isQuestionToggleOn,
  slideAnim,
  conversationHistory,
  textInput,
  setTextInput,
  chatScrollViewRef,
  onSendMessage,
  isApiLoading,
  isImageInputEnabled
}: OverlayManagerProps) {
  return (
    <>
      <AIStatusOverlay 
        isTranscriptionEnabled={isTranscriptionEnabled} 
        isLoading={isApiLoading}
        isImageInputEnabled={isImageInputEnabled}
      />
      <ChatInterface
        isTranscriptionEnabled={isTranscriptionEnabled}
        conversationHistory={conversationHistory}
        textInput={textInput}
        setTextInput={setTextInput}
        chatScrollViewRef={chatScrollViewRef}
        onSendMessage={onSendMessage}
        isLoading={isApiLoading}
      />
      
    </>
  );
}

const styles = StyleSheet.create({
  aiStatusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  aiStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 0,
    alignSelf: 'center',
  },
  processingText: {
    color: '#34C759',
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 10,
  },
  readyText: {
    color: '#007AFF',
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  
});