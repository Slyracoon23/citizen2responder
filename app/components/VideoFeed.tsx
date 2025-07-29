import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import OverlayManager from './OverlayManager';
import { ConversationMessage } from '../services/apiService';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface VideoFeedProps {
  isCameraOn: boolean;
  hasPermission: boolean | null;
  cameraRef: React.RefObject<CameraView | null>;
  
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
          <LinearGradient
            colors={colors.gradients.darkGlass}
            style={styles.cameraOffOverlay}
          >
            <MaterialIcons name="videocam-off" size={64} color={colors.text.primary} />
            <Text style={styles.cameraOffText}>
              {hasPermission === null ? 'Checking camera permissions...' : 'Camera is off'}
            </Text>
          </LinearGradient>
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
    backgroundColor: colors.surface,
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cameraOffText: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});