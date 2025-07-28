import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';



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
  const [isImageInputEnabled, setIsImageInputEnabled] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [hasPermission, requestCameraPermission] = usePermission(Camera.requestCameraPermissionsAsync);
  const [hasAudioPermission, requestAudioPermission] = usePermission(Audio.requestPermissionsAsync);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const chatScrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Speech recognition removed for Expo Go compatibility

  // Speech recognition functions removed for Expo Go compatibility

  // Removed VAD - using only speech-to-text for voice detection

  // Conversation history state
  interface ConversationMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: number;
  }

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [textInput, setTextInput] = useState('');
  const prevTranscript = useRef('');
  const lastProcessedLength = useRef(0);

  // Speech functionality removed for Expo Go compatibility

  // OpenRouter state
  const [isOpenRouterLoading, setIsOpenRouterLoading] = useState(false);

  // Base64 image conversion utility
  const convertImageToBase64 = async (): Promise<string> => {
    try {
      // Load the static logo asset
      const asset = Asset.fromModule(require('../assets/images/logo-with-text.png'));
      await asset.downloadAsync();

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // OpenRouter API call
  const runOpenRouterAPI = async (text: string, includeImage: boolean = true): Promise<string> => {
    try {
      setIsOpenRouterLoading(true);

      const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      // Prepare message content based on image inclusion
      let messageContent;

      if (includeImage) {
        // Get base64 image
        const imageBase64 = await convertImageToBase64();

        messageContent = [
          {
            type: 'text',
            text: `${text}\n\nPlease analyze this image and provide a helpful response based on both the text and what you see in the image.`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          }
        ];
      } else {
        // Text only mode
        messageContent = [
          {
            type: 'text',
            text: text
          }
        ];
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Relay Responder App',
        },
        body: JSON.stringify({
          model: 'google/gemma-3n-e4b-it',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful emergency response AI assistant. Keep all responses to 1-2 sentences maximum. Be concise, direct, and focus only on the most important information. Avoid long explanations or lists.'
            },
            {
              role: 'user',
              content: messageContent
            }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response from OpenRouter API';

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    } finally {
      setIsOpenRouterLoading(false);
    }
  };



  // Speech processing functions removed for Expo Go compatibility

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

    // Auto-scroll to bottom after adding message
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

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

    // Auto-scroll to bottom after adding message
    setTimeout(() => {
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return message.id;
  }, []);

  const handleSendTextMessage = useCallback(async () => {
    const message = textInput.trim();
    if (!message || isOpenRouterLoading) return;

    // Clear input immediately
    setTextInput('');

    // Add user message to conversation history
    addUserMessage(message);

    try {
      // Send to OpenRouter API
      const response = await runOpenRouterAPI(message, isImageInputEnabled);
      
      // Check if response is a tool call
      try {
        const parsedToolCall = JSON.parse(response);
        if (parsedToolCall.toolCall && parsedToolCall.toolCall.name === 'ask_question') {
          const question = parsedToolCall.toolCall.parameters.question;
          
          // Add question to conversation history
          addAiMessage(question);
          
          // Show question UI
          setCurrentQuestion(question);
          setIsQuestionToggleOn(true);
          return;
        }
      } catch (error) {
        // Not a tool call, handle as regular response
      }

      // Handle regular AI response
      addAiMessage(response);
    } catch (error) {
      console.error('Error sending text message:', error);
      addAiMessage('Error processing your message.');
    }
  }, [textInput, isOpenRouterLoading, addUserMessage, runOpenRouterAPI, isImageInputEnabled, addAiMessage]);

  // Speech processing functions removed for Expo Go compatibility

  // Speech processing functions removed for Expo Go compatibility

  // Speech monitoring effects removed for Expo Go compatibility

  // Move ChatOverlay definition here so it has access to the above variables
  const ChatOverlay = ({ isTranscriptionEnabled }: { isTranscriptionEnabled: boolean }) => (
    isTranscriptionEnabled ? (
      <View style={styles.chatOverlay}>
        {/* Conversation History */}
        {conversationHistory.length > 0 ? (
          <ScrollView
            ref={chatScrollViewRef}
            style={styles.chatScrollContainer}
            contentContainerStyle={styles.chatContentContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {conversationHistory.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
                ]}
              >
                <View
                  style={[
                    styles.chatBubble,
                    message.type === 'user' ? styles.userBubble : styles.aiBubble
                  ]}
                >
                  <Text
                    style={[
                      styles.chatText,
                      message.type === 'user' ? styles.userText : styles.aiText
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          /* Welcome message when no conversation history */
          <View style={styles.welcomeContainer}>
            <View style={[styles.chatBubble, styles.welcomeBubble]}>
              <Text style={styles.welcomeText}>
                Type a message to get started!
              </Text>
            </View>
          </View>
        )}

        {/* Text Input Area */}
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            value={textInput}
            onChangeText={setTextInput}
            multiline
            maxLength={500}
            editable={!isOpenRouterLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!textInput.trim() || isOpenRouterLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendTextMessage}
            disabled={!textInput.trim() || isOpenRouterLoading}
          >
            {isOpenRouterLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

      </View>
    ) : null
  );

  // AI status overlay - positioned at top of video container (where location used to be)
  const AIStatusOverlay = ({ isTranscriptionEnabled }: { isTranscriptionEnabled: boolean }) => (
    isTranscriptionEnabled ? (
      <View style={styles.aiStatusOverlay}>
        <View style={styles.aiStatusIndicator}>
          {/* Processing States */}
          {isOpenRouterLoading ? (
            <Text style={styles.processingText}>🌐 OpenRouter AI is processing...</Text>
          ) : (
            /* Ready States - Always show which AI mode is active */
            <Text style={styles.readyText}>
              {isImageInputEnabled
                ? '🌐 OpenRouter AI (Images)'
                : '🌐 OpenRouter AI (Text Only)'
              }
            </Text>
          )}
        </View>
      </View>
    ) : null
  );

  // Speech status overlay removed for Expo Go compatibility

  // AllOverlaysProps type and AllOverlays component definition here
  type AllOverlaysProps = {
    isTranscriptionEnabled: boolean;
    isQuestionToggleOn: boolean;
    slideAnim: Animated.Value;
    currentQuestion: string;
    handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
  };

  const AllOverlays = (props: AllOverlaysProps) => (
    <>
      <AIStatusOverlay isTranscriptionEnabled={props.isTranscriptionEnabled} />
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

  // Auto-start speech recognition removed for Expo Go compatibility


  const handleEndCall = async () => {
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

  const handleImageInputToggle = () => {
    setIsImageInputEnabled(!isImageInputEnabled);
  };

  const handleQuestionResponse = (response: 'yes' | 'no' | 'dont-know') => {
    console.log('Question response:', response);
    setIsQuestionToggleOn(false);

    // Send the user's response back to the AI
    const responseText = response === 'yes' ? 'Yes' : response === 'no' ? 'No' : "I can't tell";

    // Add user response to conversation history
    addUserMessage(responseText);

    // Trigger AI response to continue the conversation
    const questionAiPromise = runOpenRouterAPI(responseText, isImageInputEnabled);

    questionAiPromise
      .then(res => {
        console.log('🔍 QUESTION RESPONSE DEBUG: AI response to user answer:', res);

        // Check if response is another tool call
        try {
          const parsedToolCall = JSON.parse(res);
          if (parsedToolCall.toolCall && parsedToolCall.toolCall.name === 'ask_question') {
            const question = parsedToolCall.toolCall.parameters.question;
            console.log('🔍 QUESTION RESPONSE DEBUG: AI asked follow-up question:', question);

            // Add follow-up question to conversation history
            addAiMessage(question);

            // Also trigger the question UI for user interaction
            setCurrentQuestion(question);
            setIsQuestionToggleOn(true);
            return;
          }
        } catch (error) {
          // Not a tool call, handle as regular response
        }

        // Handle regular AI response
        addAiMessage(res);
      })
      .catch(error => {
        console.error('Error processing question response:', error);
        addAiMessage('Error processing your response.');
      })
      .finally(() => {
        setIsOpenRouterLoading(false);
      });
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
        <View style={styles.leftControls}>
          {isLocationOn && (
            <View style={styles.headerLocationContainer}>
              {isLocationLoading ? (
                <Animated.View style={{
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  }],
                }}>
                  <MaterialIcons name="hourglass-empty" size={14} color="#FF9F0A" />
                </Animated.View>
              ) : (
                <MaterialIcons name="location-on" size={14} color="#34C759" />
              )}
              <Text style={styles.headerLocationText}>
                {isLocationLoading
                  ? "Getting..."
                  : currentLocation
                    ? `${currentLocation.coords.latitude.toFixed(2)}, ${currentLocation.coords.longitude.toFixed(2)}`
                    : "Location"
                }
              </Text>
            </View>
          )}
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={[
              styles.headerToggle,
              isImageInputEnabled && styles.headerToggleActive,
              isOpenRouterLoading && { backgroundColor: 'rgba(52, 199, 89, 0.3)' }
            ]}
            onPress={handleImageInputToggle}
          >
            <MaterialIcons
              name={isImageInputEnabled ? "visibility" : "visibility-off"}
              size={24}
              color={isOpenRouterLoading ? "#FFD600" : isImageInputEnabled ? "#34C759" : "white"}
            />
          </TouchableOpacity>
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
    width: 142, // Same width as rightControls (44px per button + 10px margin * 3 buttons = 142px)
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerLocationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
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
    width: 142, // Fixed width to match leftControls (3 buttons)
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
    top: 40, // Add more top space to avoid overlap with AI status
    left: 15,
    right: 15,
    bottom: 15,
    zIndex: 5,
    flexDirection: 'column',
  },
  chatScrollContainer: {
    flex: 1,
    // Remove maxHeight to allow full container usage
  },
  chatContentContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 3,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    maxWidth: '80%',
    borderBottomRightRadius: 4, // Subtle message tail effect
  },
  aiBubble: {
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    maxWidth: '80%',
    borderBottomLeftRadius: 4, // Subtle message tail effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  aiText: {
    color: '#FFD600',
    fontSize: 12,
    fontWeight: '400',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignSelf: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'center',
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
  speechStatusOverlay: {
    position: 'absolute',
    bottom: 20, // Move back to original bottom position
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 7,
  },
  chatBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  chatText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
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
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
    minHeight: 20,
    paddingVertical: 0,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
}); 
