import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import ChatInterface, { ChatInput } from './components/ChatInterface';
import PreCareModal from './components/PreCareModal';
import ReportModal from './components/ReportModal';
import { RightSideToggles } from './components/SideToggles';
import VideoCallControls from './components/VideoCallControls';
import VideoFeed from './components/VideoFeed';
import { useAnimations } from './hooks/useAnimations';
import { useConversation } from './hooks/useConversation';
import { usePermissions } from './hooks/usePermissions';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useToggleFeature } from './hooks/useToggleFeature';
import apiService from './services/apiService';
import { videoCallStyles } from './styles/videoCallStyles';
import { resetToDefaultPlayback } from './utils/audioSessionUtils';

export default function VideoCallScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [showDefaultReport, setShowDefaultReport] = useState(false);
  const [isPreCareModalVisible, setIsPreCareModalVisible] = useState(false);
  const [currentPreCareData, setCurrentPreCareData] = useState<any>(null);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);


  // AI Processing Banner Animation
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTranslateY = useRef(new Animated.Value(-50)).current;
  const dotAnimations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3)
  ]).current;

  // Default report data to show when toggle is activated
  const defaultReportData = {
    report_id: "DEFAULT_001",
    summary: "Emergency Report Ready",
    details: {
      incident_type: "System Notification",
      description: "Report generation is now enabled. The system is ready to create emergency reports when needed based on the conversation and observations.",
      location: {
        address: "Current Location",
        latitude: undefined,
        longitude: undefined
      },
      injuries_reported: false,
      number_of_people_involved: 0,
      is_active_threat: false,
      timestamp: new Date().toISOString()
    }
  };

  // Custom hooks
  const { hasCamera, hasAudio, requestCameraPermission, requestAudioPermission } = usePermissions();
  const {
    slideAnim,
    micPulseAnim,
    startSlideAnimation,
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
    stopSpeech,
    isSpeaking,
  } = useConversation();


  const {
    isCameraOn,
    isVoiceOn,
    isTranscriptionEnabled,
    isQuestionToggleOn,
    isImageInputEnabled,
    isGenerateReportOn,
    isPreCareToggleOn,
    isKeyboardOn,
    isAssessCalled,
    setIsQuestionToggleOn,
    setIsPreCareToggleOn,
    setIsAssessCalled,
    setIsGenerateReportOn,
    handleCameraToggle,
    handleVoiceToggle,
    toggleTranscription,
    toggleQuestion,
    toggleImageInput,
    toggleGenerateReport,
    togglePreCare,
    toggleKeyboard,
  } = useToggleFeature();

  const {
    recordingState,
    errorMessage: sttError,
    startRecording,
    stopRecording,
    clearError: clearSttError,
    resetAudioSession,
  } = useSpeechToText();

  // Animation effects
  useEffect(() => {
    startSlideAnimation(isQuestionToggleOn ? 1 : 0);
  }, [isQuestionToggleOn]);

  // Auto-activate access on component mount
  useEffect(() => {
    if (!isAssessCalled) {
      setIsQuestionToggleOn(true);
      setIsAssessCalled(true);
      addAiMessage(
        "I'm here to help you assess the situation. I'll ask you follow-up questions to better understand what's happening and provide appropriate guidance. Sounds good?",
        true,
        () => {
          console.log('🔍 AUTO-ASSESS DEBUG: Initial message spoken, adding first question');
          addAiMessage("What is happening right now? Is anyone injured or in immediate danger?");
        }
      );
    }
  }, []);

  // AI Processing Banner Animation
  useEffect(() => {
    if (isApiLoading) {
      // Show banner with slide down animation
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bannerTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing dots animation
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      // Start staggered dot animations
      const dotAnimationRefs = [
        createDotAnimation(dotAnimations[0], 0).start(),
        createDotAnimation(dotAnimations[1], 150).start(),
        createDotAnimation(dotAnimations[2], 300).start(),
      ];

      return () => {
        // Stop dot animations when component unmounts or loading stops
        dotAnimationRefs.forEach(animation => animation && animation.stop && animation.stop());
      };
    } else {
      // Hide banner with slide up animation
      Animated.parallel([
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bannerTranslateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset dot opacities
      dotAnimations.forEach(dot => dot.setValue(0.3));
    }
  }, [isApiLoading]);


  // Cleanup audio session when leaving the video call screen
  useEffect(() => {
    return () => {
      // Reset audio session to playback mode when component unmounts
      resetToDefaultPlayback().catch((error) => {
        console.error('Failed to reset audio session on component unmount:', error);
      });
    };
  }, []);


  // Handlers
  const handleEndCall = () => {
    router.back();
  };

  const handleVoice = () => {
    handleVoiceToggle(hasAudio, requestAudioPermission);
  };

  const handleKeyboard = () => {
    toggleKeyboard();
    setIsTextInputVisible(!isTextInputVisible);
  };

  const handleShowDefaultReport = () => {
    setCurrentReport(defaultReportData);
    setIsReportModalVisible(true);
  };

  const handleShowDefaultPreCare = () => {
    const defaultPreCareData = {
      title: "General Emergency Pre-Care",
      instructions: [
        "Stay calm and assess the situation",
        "Check if the area is safe for you and others",
        "Call emergency services if needed",
        "Provide basic first aid if trained to do so",
        "Monitor the person's breathing and consciousness",
        "Keep the person comfortable until help arrives"
      ],
      priority: "medium" as const
    };
    setCurrentPreCareData(defaultPreCareData);
    setIsPreCareModalVisible(true);
  };

  const handleSttPressIn = async () => {
    console.log('🎤 STT: Press in - starting recording');
    clearSttError(); // Clear any previous errors
    await startRecording();
  };

  const handleSttPressOut = async () => {
    console.log('🎤 STT: Press out - stopping recording');
    const transcript = await stopRecording();
    
    if (transcript) {
      console.log('🎤 STT: Transcript received:', transcript);
      
      // Stop any ongoing speech before sending new message
      stopSpeech();
      
      // Add the transcribed message to the chat
      addUserMessage(transcript);
      
      // Ensure audio session is reset after successful STT
      await resetAudioSession();
      
      try {
        setIsApiLoading(true);
        let data;

        if (isImageInputEnabled && cameraRef.current) {
          // Capture a single frame if vision is enabled
          const photo = await cameraRef.current.takePictureAsync({ 
            base64: true,
            skipProcessing: true,
            shutterSound: false
          });
          if (photo && photo.base64) {
            console.log(`🔍 CONV DEBUG: Sending STT message with 1 image frame.`);
            data = await apiService.callOpenRouterVisionAPI(conversationHistory, [photo.base64], transcript);
          } else {
            // Fallback to text-only if frame capture fails
            data = await apiService.callOpenRouterAPI(conversationHistory, transcript);
          }
        } else {
          // Send text-only message
          data = await apiService.callOpenRouterAPI(conversationHistory, transcript);
        }

        // Handle tool calls if present
        const toolCalls = data.choices?.[0]?.message?.tool_calls;
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
          handleToolCalls(toolCalls);
        } else {
          // Only add AI message content if no tool calls were made
          const aiContent = data.choices?.[0]?.message?.content || 'No response from OpenRouter API';
          addAiMessage(aiContent);
          console.log('🔍 CONV DEBUG: Added AI response to STT message:', aiContent);
        }

      } catch (error) {
        console.error('Error sending STT message:', error);
        addAiMessage('Sorry, I encountered an error processing your voice message.');
      } finally {
        setIsApiLoading(false);
      }
    } else if (sttError) {
      console.log('🎤 STT: Error occurred:', sttError);
      // Show error message briefly in chat
      addAiMessage(`Voice recognition error: ${sttError}`);
    }
  };

  // Helper to handle forced report generation
  const handleForcedReportGeneration = async () => {
    try {
      console.log('🔧 FORCED REPORT DEBUG: Starting forced report generation');
      setIsApiLoading(true);
      
      const data = await apiService.callOpenRouterAPIWithForcedTool(
        conversationHistory, 
        'generate_report',
        'Generate an emergency report based on our conversation'
      );
      
      // Handle tool calls if present
      const toolCalls = data.choices?.[0]?.message?.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        console.log('🔧 FORCED REPORT DEBUG: Processing forced tool calls with bypass');
        handleToolCalls(toolCalls, true); // bypass toggle check for forced calls
      } else {
        console.log('🔧 FORCED REPORT DEBUG: No tool calls returned from forced API call');
        addAiMessage('Sorry, I was unable to generate a report at this time.');
      }
      
    } catch (error) {
      console.error('🔧 FORCED REPORT ERROR: Failed to generate forced report:', error);
      addAiMessage('Sorry, I encountered an error generating the report.');
    } finally {
      setIsApiLoading(false);
    }
  };


    const handleForcedCareGeneration = async () => {
    try {
      console.log('🔧 FORCED CARE DEBUG: Starting forced Care generation');
      setIsApiLoading(true);
      
      const data = await apiService.callOpenRouterAPIWithForcedTool(
        conversationHistory, 
        'show_precare_instructions',
        'Generate an Care report based on our conversation, you must output at least 2-3 care instructions'
      );
      
      // Handle tool calls if present
      const toolCalls = data.choices?.[0]?.message?.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        console.log('🔧 FORCED CARE DEBUG: Processing forced tool calls with bypass');
        handleToolCalls(toolCalls, true); // bypass toggle check for forced calls
      } else {
        console.log('🔧 FORCED CARE DEBUG: No tool calls returned from forced API call');
        addAiMessage('Sorry, I was unable to generate a care at this time.');
      }
      
    } catch (error) {
      console.error('🔧 FORCED CARE ERROR: Failed to generate forced care:', error);
      addAiMessage('Sorry, I encountered an error generating the care.');
    } finally {
      setIsApiLoading(false);
    }
  };

  // Helper to handle OpenRouter tool calls
  const handleToolCalls = (toolCalls: any[], bypassToggleCheck: boolean = false) => {
    console.log('🔧 TOOL CALL HANDLER DEBUG: Processing tool calls:', JSON.stringify(toolCalls, null, 2));
    console.log('🔧 TOOL CALL HANDLER DEBUG: Bypass toggle check:', bypassToggleCheck);
    toolCalls.forEach((toolCall) => {
      console.log('🔧 TOOL CALL DEBUG: Processing tool call:', toolCall);
      console.log('🔧 TOOL CALL DEBUG: Type:', toolCall.type);
      console.log('🔧 TOOL CALL DEBUG: Function name:', toolCall.function?.name);
      
      if (toolCall.type === 'function' && toolCall.function?.name === 'generate_report') {
        console.log('🔧 GENERATE_REPORT DEBUG: Found generate_report tool call');
        if (!bypassToggleCheck && !isGenerateReportOn) {
          console.log('🔧 GENERATE_REPORT DEBUG: Report toggle is OFF and not bypassing - ignoring report generation');
          return;
        }
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
      } else if (toolCall.type === 'function' && toolCall.function?.name === 'show_precare_instructions') {
        console.log('🔧 PRECARE_INSTRUCTIONS DEBUG: Found show_precare_instructions tool call');
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log('🔧 PRECARE_INSTRUCTIONS DEBUG: Parsed arguments:', args);
          if (args.title && args.instructions && args.priority) {
            console.log('🔧 PRECARE_INSTRUCTIONS DEBUG: Auto-enabling pre-care toggle and setting data');
            setIsPreCareToggleOn(true);
            setCurrentPreCareData(args);
            setIsPreCareModalVisible(true);
            console.log('🔧 PRECARE_INSTRUCTIONS DEBUG: PreCare modal activated with auto-toggle');
          } else {
            console.log('🔧 PRECARE_INSTRUCTIONS DEBUG: Missing required pre-care data');
          }
        } catch (e) {
          console.error('🔧 PRECARE_INSTRUCTIONS ERROR: Failed to parse tool call arguments:', e);
        }
      } else {
        console.log('🔧 TOOL CALL DEBUG: Tool call not matched - type:', toolCall.type, 'name:', toolCall.function?.name);
      }
    });
  };

  const handleSendMessage = async () => {
    const message = textInput.trim();
    if (!message) return;

    // Stop any ongoing speech before sending new message
    stopSpeech();
    
    addUserMessage(message);
    setTextInput('');

    try {
      setIsApiLoading(true);
      let data;

      if (isImageInputEnabled && cameraRef.current) {
        // Capture a single frame if vision is enabled
        const photo = await cameraRef.current.takePictureAsync({ 
          base64: true,
          skipProcessing: true,
          shutterSound: false
        });
        if (photo && photo.base64) {
          console.log(`🔍 CONV DEBUG: Sending message with 1 image frame.`);
          data = await apiService.callOpenRouterVisionAPI(conversationHistory, [photo.base64], message);
        } else {
          // Fallback to text-only if frame capture fails
          data = await apiService.callOpenRouterAPI(conversationHistory, message);
        }
      } else {
        // Send text-only message
        data = await apiService.callOpenRouterAPI(conversationHistory, message);
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

  

  const handleCloseReport = () => {
    setIsReportModalVisible(false);
    setCurrentReport(null);
    toggleGenerateReport(); // Turn off generate report when modal is closed
  };

  const handleSendToEmergency = () => {
    setIsReportModalVisible(false);
    setCurrentReport(null);
    toggleGenerateReport(); // Turn off generate report when report is sent
  };

  const handleClosePreCare = () => {
    setIsPreCareModalVisible(false);
    setCurrentPreCareData(null);
    togglePreCare() // Turn off generate precare when care is sent
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
    <View style={videoCallStyles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={videoCallStyles.container}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {/* AI Processing Banner */}
          {isApiLoading && (
            <Animated.View 
              style={[
                videoCallStyles.aiProcessingBanner,
                {
                  opacity: bannerOpacity,
                  transform: [{ translateY: bannerTranslateY }],
                }
              ]}
            >
              <MaterialIcons name="psychology" size={16} color="white" />
              <Text style={videoCallStyles.aiProcessingText}>AI is thinking</Text>
              <View style={{ flexDirection: 'row', marginLeft: 4 }}>
                {dotAnimations.map((dot, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      videoCallStyles.aiProcessingDot,
                      { opacity: dot }
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Full Screen Video - Now extends to top */}
          <View style={videoCallStyles.fullScreenVideoContainer}>
            <VideoFeed
              isCameraOn={isCameraOn}
              hasPermission={hasCamera}
              cameraRef={cameraRef}
              isTranscriptionEnabled={false} // Remove built-in overlays
              isQuestionToggleOn={isQuestionToggleOn}
              slideAnim={slideAnim}
              conversationHistory={[]} // Remove built-in overlays
              textInput=""
              setTextInput={() => {}}
              chatScrollViewRef={chatScrollViewRef}
              onSendMessage={() => {}}
              isApiLoading={isApiLoading}
              isImageInputEnabled={isImageInputEnabled}
            />



            

            {/* Chat History Overlay at Top */}
            <View style={videoCallStyles.chatOverlayTop}>
              <ChatInterface
                isTranscriptionEnabled={isTranscriptionEnabled}
                conversationHistory={conversationHistory}
                chatScrollViewRef={chatScrollViewRef}
                isLoading={isApiLoading}
              />
            </View>

            {/* Right Side Toggle - Vision */}
            <RightSideToggles
              isImageInputEnabled={isImageInputEnabled}
              onImageInputToggle={toggleImageInput}
            />

            {/* Chat Input Above Controls */}
            {isTextInputVisible && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={videoCallStyles.chatInputAboveControls}
              >
                <ChatInput
                  textInput={textInput}
                  setTextInput={setTextInput}
                  onSendMessage={handleSendMessage}
                  isLoading={isApiLoading}
                />
              </KeyboardAvoidingView>
            )}

            {/* Control Buttons Overlay at Bottom */}
            <View style={videoCallStyles.controlsOverlayBottom}>
              <VideoCallControls
                isKeyboardOn={isKeyboardOn}
                recordingState={recordingState}
                onKeyboardPress={handleKeyboard}
                onSttPressIn={handleSttPressIn}
                onSttPressOut={handleSttPressOut}
                onEndCall={handleEndCall}
                micPulseAnim={micPulseAnim}
                isCareToggleOn={isPreCareToggleOn}
                isGenerateReportOn={isGenerateReportOn}
                isQuestionToggleOn={isQuestionToggleOn}
                onCareConfirm={() => {
                  if (isPreCareToggleOn) {
                    // Turn off care instructions
                    togglePreCare();
                  } else {
                    // Turn on care instructions and deactivate other modes
                    setIsQuestionToggleOn(false);
                    setIsAssessCalled(false);
                    setIsGenerateReportOn(false);
                    togglePreCare();
                    addAiMessage("I will now show care instructions.",
                      true,
                    () => {
                      // Auto-generate report after message is spoken
                      console.log('🔧 REPORT DEBUG: Speech completed, triggering forced report generation');
                      handleForcedCareGeneration();
                    });
                  }
                }}
                onGenerateReportConfirm={() => {
                  if (isGenerateReportOn) {
                    // Turn off report generation
                    toggleGenerateReport();
                  } else {
                    // Turn on report generation and deactivate other modes
                    setIsQuestionToggleOn(false);
                    setIsAssessCalled(false);
                    setIsPreCareToggleOn(false);
                    toggleGenerateReport();
                    addAiMessage(
                      "I will now generate a report.",
                      true, // enableSpeech
                      () => {
                        // Auto-generate report after message is spoken
                        console.log('🔧 REPORT DEBUG: Speech completed, triggering forced report generation');
                        handleForcedReportGeneration();
                      }
                    );
                  }
                }}
                onAssessConfirm={() => {
                  if (isQuestionToggleOn) {
                    // Turn off assess mode
                    setIsQuestionToggleOn(false);
                    setIsAssessCalled(false);
                    addAiMessage("Assessment mode turned off.");
                  } else {
                    // Turn on assess mode and deactivate other modes
                    setIsPreCareToggleOn(false);
                    setIsGenerateReportOn(false);
                    setIsQuestionToggleOn(true);
                    setIsAssessCalled(true);
                    addAiMessage(
                      "I'm here to help you assess the situation. I'll ask you follow-up questions to better understand what's happening and provide appropriate guidance. Sounds good?",
                      true, // enableSpeech
                      () => {
                        // Auto-add first assessment question after initial message is spoken
                        console.log('🔍 ASSESS DEBUG: Initial message spoken, adding first question');
                        addAiMessage("What is happening right now? Is anyone injured or in immediate danger?");
                      }
                    );
                  }
                }}
              />
            </View>
          </View>

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

          {/* PreCare Modal */}
          <PreCareModal
            visible={isPreCareModalVisible}
            preCareData={currentPreCareData}
            onClose={handleClosePreCare}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}