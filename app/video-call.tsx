import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  // Add question popover state with animation
  const [isQuestionToggleOn, setIsQuestionToggleOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const insets = useSafeAreaInsets();

  // Animation effect for sliding question popover
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isQuestionToggleOn ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isQuestionToggleOn, slideAnim]);

  const handleEndCall = () => {
    router.back();
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const handleLocation = () => {
    setIsLocationOn(!isLocationOn);
  };

  const handleVoice = () => {
    setIsVoiceOn(!isVoiceOn);
    // If turning on, could start recording
    if (!isVoiceOn) {
      // Start voice recording functionality here
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
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
    // Handle the response - could send to API, store in state, etc.
    setIsQuestionToggleOn(false);
    
    // Optional: Show next question after a delay
    // setTimeout(() => {
    //   setCurrentQuestion("Is the person conscious?");
    //   setShowQuestionPopover(true);
    // }, 2000);
  };

  const showNewQuestion = (question: string) => {
    setCurrentQuestion(question);
    setIsQuestionToggleOn(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Top Header Area with Gap */}
      <View style={[styles.headerArea, { paddingTop: insets.top }]}>
        {/* Live Indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Right Side Controls */}
        <View style={styles.rightControls}>
          {/* Question Toggle */}
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

          {/* Transcription Toggle */}
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

      {/* Video Feed Area with Top Gap */}
      <View style={styles.videoContainer}>
        {isCameraOn ? (
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            {/* Chat Message Overlay */}
            <View style={styles.chatOverlay}>
              <View style={styles.chatBubble}>
                <Text style={styles.chatText}>
                  Okay, I see the white cord now. Is there anything specific you&apos;d like to ask about it?
                </Text>
              </View>
            </View>

            {/* Question Popover */}
            {isQuestionToggleOn && (
              <Animated.View style={[
                styles.questionOverlay, 
                { 
                  transform: [{ 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0], // slide from 200px below to normal position
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
            )}
          </CameraView>
        ) : (
          <View style={styles.camera}>
            {/* Camera Off Overlay */}
            <View style={styles.cameraOffOverlay}>
              <MaterialIcons name="videocam-off" size={48} color="white" />
              <Text style={styles.cameraOffText}>Camera is off</Text>
            </View>
            
            {/* Chat Message Overlay */}
            <View style={styles.chatOverlay}>
              <View style={styles.chatBubble}>
                <Text style={styles.chatText}>
                  Okay, I see the white cord now. Is there anything specific you&apos;d like to ask about it?
                </Text>
              </View>
            </View>

            {/* Question Popover (also show when camera is off) */}
            {isQuestionToggleOn && (
              <Animated.View style={[
                styles.questionOverlay, 
                { 
                  transform: [{ 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0], // slide from 200px below to normal position
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
            )}
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleCamera}
        >
          <View style={[
            styles.buttonBackground,
            !isCameraOn && styles.buttonBackgroundOff
          ]}>
            <MaterialIcons 
              name={isCameraOn ? "videocam" : "videocam-off"} 
              size={24} 
              color={isCameraOn ? "#000" : "white"} 
            />
          </View>
          <Text style={styles.buttonLabel}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleLocation}
        >
          <View style={[
            styles.buttonBackground,
            !isLocationOn && styles.buttonBackgroundOff
          ]}>
            <MaterialIcons 
              name={isLocationOn ? "location-on" : "location-off"} 
              size={24} 
              color={isLocationOn ? "#000" : "white"} 
            />
          </View>
          <Text style={styles.buttonLabel}>Location</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleVoice}
        >
          <View style={[
            styles.buttonBackground,
            !isVoiceOn && styles.buttonBackgroundOff
          ]}>
            <MaterialIcons 
              name={isVoiceOn ? "mic" : "mic-off"} 
              size={24} 
              color={isVoiceOn ? "#000" : "white"} 
            />
          </View>
          <Text style={styles.buttonLabel}>Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleEndCall}
        >
          <View style={styles.endCallButton}>
            <MaterialIcons name="close" size={24} color="white" />
          </View>
          <Text style={styles.buttonLabel}>End</Text>
        </TouchableOpacity>
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
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  liveIndicator: {
    alignItems: 'center',
    flex: 1,
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
    top: 40,
    left: 20,
    right: 20,
    zIndex: 5,
    alignItems: 'center',
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
}); 