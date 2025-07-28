import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StatusBar, 
  TouchableOpacity, 
  Text, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { videoCallStyles } from './styles/videoCallStyles';
import { usePermissions } from './hooks/usePermissions';
import { useAnimations } from './hooks/useAnimations';
import { useConversation } from './hooks/useConversation';
import { useLocation } from './hooks/useLocation';
import { useToggleFeature } from './hooks/useToggleFeature';
import Header from './components/Header';
import VideoFeed from './components/VideoFeed';
import VideoCallControls from './components/VideoCallControls';
import apiService from './services/apiService';

export default function VideoCallScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");

  // Custom hooks
  const { hasCamera, hasAudio, requestCameraPermission, requestAudioPermission } = usePermissions();
  const {
    slideAnim,
    rotateAnim,
    micPulseAnim,
    startSlideAnimation,
    startRotateAnimation,
    resetRotateAnimation,
  } = useAnimations();
  
  const {
    conversationHistory,
    isApiLoading,
    setIsApiLoading,
    textInput,
    setTextInput,
    chatScrollViewRef,
    addUserMessage,
    addAiMessage,
  } = useConversation();

  const {
    isLocationOn,
    currentLocation,
    isLocationLoading,
  } = useLocation();

  const {
    isCameraOn,
    isVoiceOn,
    isTranscriptionEnabled,
    isQuestionToggleOn,
    isImageInputEnabled,
    setIsQuestionToggleOn,
    handleCameraToggle,
    handleVoiceToggle,
    toggleTranscription,
    toggleQuestion,
    toggleImageInput,
  } = useToggleFeature();

  // Animation effects
  useEffect(() => {
    startSlideAnimation(isQuestionToggleOn ? 1 : 0);
  }, [isQuestionToggleOn]);

  useEffect(() => {
    if (isLocationLoading) {
      const rotateAnimation = startRotateAnimation();
      return () => rotateAnimation.stop();
    } else {
      resetRotateAnimation();
    }
  }, [isLocationLoading]);

  // Handlers
  const handleEndCall = () => {
    router.back();
  };

  const handleCamera = () => {
    handleCameraToggle(hasCamera, requestCameraPermission);
  };

  const handleVoice = () => {
    handleVoiceToggle(hasAudio, requestAudioPermission);
  };

  const handleSendMessage = async () => {
    const message = textInput.trim();
    if (!message) return;

    addUserMessage(message);
    setTextInput('');

    try {
      setIsApiLoading(true);
      let response = '';

      if (isImageInputEnabled && cameraRef.current) {
        // Capture a single frame if vision is enabled
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        
        if (photo && photo.base64) {
          console.log(`🔍 CONV DEBUG: Sending message with 1 image frame.`);
          response = await apiService.callOpenRouterVisionAPI([photo.base64], message);
        } else {
          // Fallback to text-only if frame capture fails
          response = await apiService.callOpenRouterAPI(message);
        }

      } else {
        // Send text-only message
        response = await apiService.callOpenRouterAPI(message);
      }
      
      addAiMessage(response);
      console.log('🔍 CONV DEBUG: Added AI response:', response);

    } catch (error) {
      console.error('Error sending message:', error);
      addAiMessage('Sorry, I encountered an error.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleQuestionResponseWrapper = async (response: 'yes' | 'no' | 'dont-know') => {
    const responseText = response === 'yes' ? 'Yes' : response === 'no' ? 'No' : "I can't tell";
    addUserMessage(responseText);
    setIsQuestionToggleOn(false);

    try {
      setIsApiLoading(true);
      const aiResponse = await apiService.callOpenRouterAPI(responseText);
      addAiMessage(aiResponse);
    } catch (error) {
      console.error('Error processing question response:', error);
      addAiMessage('Error processing your response.');
    } finally {
      setIsApiLoading(false);
    }
  };

  // Handle permission denied case
  if (hasCamera === false) {
    return (
      <View style={[videoCallStyles.container, videoCallStyles.permissionContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={videoCallStyles.permissionContent}>
          <MaterialIcons name="videocam-off" size={64} color="white" />
          <Text style={videoCallStyles.permissionTitle}>Camera Access Required</Text>
          <Text style={videoCallStyles.permissionText}>
            Please enable camera access to use video calling features.
          </Text>
          <TouchableOpacity
            style={videoCallStyles.permissionButton}
            onPress={requestCameraPermission}
          >
            <Text style={videoCallStyles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={videoCallStyles.backButton}
            onPress={handleEndCall}
          >
            <Text style={videoCallStyles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={videoCallStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={videoCallStyles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {/* Header */}
          <Header
            isLocationOn={isLocationOn}
            isLocationLoading={isLocationLoading}
            currentLocation={currentLocation}
            rotateAnim={rotateAnim}
            isImageInputEnabled={isImageInputEnabled}
            isQuestionToggleOn={isQuestionToggleOn}
            isTranscriptionEnabled={isTranscriptionEnabled}
            isApiLoading={isApiLoading}
            onImageInputToggle={toggleImageInput}
            onQuestionToggle={toggleQuestion}
            onTranscriptionToggle={toggleTranscription}
          />

          {/* Video Feed with Overlays */}
          <VideoFeed
            isCameraOn={isCameraOn}
            hasPermission={hasCamera}
            cameraRef={cameraRef}
            isTranscriptionEnabled={isTranscriptionEnabled}
            isQuestionToggleOn={isQuestionToggleOn}
            slideAnim={slideAnim}
            currentQuestion={currentQuestion}
            handleQuestionResponse={handleQuestionResponseWrapper}
            conversationHistory={conversationHistory}
            textInput={textInput}
            setTextInput={setTextInput}
            chatScrollViewRef={chatScrollViewRef}
            onSendMessage={handleSendMessage}
            isApiLoading={isApiLoading}
            isImageInputEnabled={isImageInputEnabled}
          />

          {/* Control Buttons */}
          <VideoCallControls
            isCameraOn={isCameraOn}
            isVoiceOn={isVoiceOn}
            onCameraPress={handleCamera}
            onVoicePress={handleVoice}
            onEndCall={handleEndCall}
            micPulseAnim={micPulseAnim}
          />

          {/* Progress Bar */}
          <View style={videoCallStyles.progressContainer}>
            <View style={videoCallStyles.progressBar} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}