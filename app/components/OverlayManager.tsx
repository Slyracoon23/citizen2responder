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

interface QuestionPopoverProps {
  isQuestionToggleOn: boolean;
  slideAnim: Animated.Value;
  currentQuestion: string;
  handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
}

const QuestionPopover = ({ isQuestionToggleOn, slideAnim, currentQuestion, handleQuestionResponse }: QuestionPopoverProps) => {
  if (!isQuestionToggleOn) return null;

  return (
    <Animated.View style={[
      styles.questionOverlay,
      {
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [600, 0],
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
            <Text style={styles.responseButtonText}>Can't Tell</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

interface OverlayManagerProps {
  isTranscriptionEnabled: boolean;
  isQuestionToggleOn: boolean;
  slideAnim: Animated.Value;
  currentQuestion: string;
  handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
  
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
  currentQuestion,
  handleQuestionResponse,
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
      <QuestionPopover
        isQuestionToggleOn={isQuestionToggleOn}
        slideAnim={slideAnim}
        currentQuestion={currentQuestion}
        handleQuestionResponse={handleQuestionResponse}
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
  questionOverlay: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    padding: 20,
    borderRadius: 20,
    zIndex: 1003,
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
});