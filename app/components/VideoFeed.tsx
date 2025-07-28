import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import OverlayManager from './OverlayManager';
import { ConversationMessage } from '../services/apiService';

interface VideoFeedProps {
  isCameraOn: boolean;
  hasPermission: boolean | null;
  cameraRef: React.RefObject<CameraView>;
  
  // Overlay props
  isTranscriptionEnabled: boolean;
  isQuestionToggleOn: boolean;
  slideAnim: any;
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

export default function VideoFeed({
  isCameraOn,
  hasPermission,
  cameraRef,
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
}: VideoFeedProps) {
  return (
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
      <OverlayManager
        isTranscriptionEnabled={isTranscriptionEnabled}
        isQuestionToggleOn={isQuestionToggleOn}
        slideAnim={slideAnim}
        currentQuestion={currentQuestion}
        handleQuestionResponse={handleQuestionResponse}
        conversationHistory={conversationHistory}
        textInput={textInput}
        setTextInput={setTextInput}
        chatScrollViewRef={chatScrollViewRef}
        onSendMessage={onSendMessage}
        isApiLoading={isApiLoading}
        isImageInputEnabled={isImageInputEnabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
});