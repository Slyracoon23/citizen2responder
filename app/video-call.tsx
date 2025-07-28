import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Header from './components/Header';
import VideoCallControls from './components/VideoCallControls';
import VideoFeed from './components/VideoFeed';
import ReportModal from './components/ReportModal';
import { useAnimations } from './hooks/useAnimations';
import { useConversation } from './hooks/useConversation';
import { useLocation } from './hooks/useLocation';
import { usePermissions } from './hooks/usePermissions';
import { useToggleFeature } from './hooks/useToggleFeature';
import apiService from './services/apiService';
import { videoCallStyles } from './styles/videoCallStyles';

export default function VideoCallScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

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

  // Helper to handle OpenRouter tool calls
  const handleToolCalls = (toolCalls: any[]) => {
    console.log('🔧 TOOL CALL HANDLER DEBUG: Processing tool calls:', JSON.stringify(toolCalls, null, 2));
    toolCalls.forEach((toolCall) => {
      console.log('🔧 TOOL CALL DEBUG: Processing tool call:', toolCall);
      console.log('🔧 TOOL CALL DEBUG: Type:', toolCall.type);
      console.log('🔧 TOOL CALL DEBUG: Function name:', toolCall.function?.name);
      
      if (toolCall.type === 'function' && toolCall.function?.name === 'ask_question') {
        console.log('🔧 ASK_QUESTION DEBUG: Found ask_question tool call');
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('🔧 ASK_QUESTION DEBUG: Parsed arguments:', args);
          if (args.question) {
            console.log('🔧 ASK_QUESTION DEBUG: Setting question:', args.question);
            setCurrentQuestion(args.question);
            setIsQuestionToggleOn(true);
            console.log('🔧 ASK_QUESTION DEBUG: Question toggle activated');
          } else {
            console.log('🔧 ASK_QUESTION DEBUG: No question found in arguments');
          }
        } catch (e) {
          console.error('🔧 ASK_QUESTION ERROR: Failed to parse tool call arguments:', e);
        }
      } else if (toolCall.type === 'function' && toolCall.function?.name === 'generate_report') {
        console.log('🔧 GENERATE_REPORT DEBUG: Found generate_report tool call');
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('🔧 GENERATE_REPORT DEBUG: Parsed arguments:', args);
          if (args.report_id && args.summary && args.details) {
            console.log('🔧 GENERATE_REPORT DEBUG: Setting report data');
            setCurrentReport(args);
            setIsReportModalVisible(true);
            console.log('🔧 GENERATE_REPORT DEBUG: Report modal activated');
          } else {
            console.log('🔧 GENERATE_REPORT DEBUG: Missing required report data');
          }
        } catch (e) {
          console.error('🔧 GENERATE_REPORT ERROR: Failed to parse tool call arguments:', e);
        }
      } else {
        console.log('🔧 TOOL CALL DEBUG: Tool call not matched - type:', toolCall.type, 'name:', toolCall.function?.name);
      }
    });
  };

  const handleSendMessage = async () => {
    const message = textInput.trim();
    if (!message) return;

    addUserMessage(message);
    setTextInput('');

    try {
      setIsApiLoading(true);
      let data;

      if (isImageInputEnabled && cameraRef.current) {
        // Capture a single frame if vision is enabled
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        if (photo && photo.base64) {
          console.log(`🔍 CONV DEBUG: Sending message with 1 image frame.`);
          data = await apiService.callOpenRouterVisionAPI([photo.base64], message);
        } else {
          // Fallback to text-only if frame capture fails
          data = await apiService.callOpenRouterAPI(message);
        }
      } else {
        // Send text-only message
        data = await apiService.callOpenRouterAPI(message);
      }

      // Handle tool calls if present
      const toolCalls = data.choices?.[0]?.message?.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        handleToolCalls(toolCalls);
      } else {
        // Only add AI message content if no tool calls were made
        const aiContent = data.choices?.[0]?.message?.content || 'No response from OpenRouter API';
        addAiMessage(aiContent);
        console.log('🔍 CONV DEBUG: Added AI response:', aiContent);
      }

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
      const data = await apiService.callOpenRouterAPI(responseText);
      // Handle tool calls if present
      const toolCalls = data.choices?.[0]?.message?.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        handleToolCalls(toolCalls);
      } else {
        // Only add AI message content if no tool calls were made
        const aiContent = data.choices?.[0]?.message?.content || 'No response from OpenRouter API';
        addAiMessage(aiContent);
      }
    } catch (error) {
      console.error('Error processing question response:', error);
      addAiMessage('Error processing your response.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleCloseReport = () => {
    setIsReportModalVisible(false);
    setCurrentReport(null);
  };

  const handleSendToEmergency = () => {
    setIsReportModalVisible(false);
    setCurrentReport(null);
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

          {/* Report Modal */}
          <ReportModal
            visible={isReportModalVisible}
            report={currentReport}
            onClose={handleCloseReport}
            onSendToEmergency={handleSendToEmergency}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}