import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  // Add question popover state with animation
  const [isQuestionToggleOn, setIsQuestionToggleOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const rotateAnim = useRef(new Animated.Value(0)).current; // Animation for loading spinner
  const micPulseAnim = useRef(new Animated.Value(1)).current; // Animation for microphone pulse
  const insets = useSafeAreaInsets();

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);

  // Request audio permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasAudioPermission(status === 'granted');
    })();
  }, []);

  // Animation effect for sliding question popover
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isQuestionToggleOn ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isQuestionToggleOn, slideAnim]);

  // Animation effect for location loading spinner
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



  const handleEndCall = () => {
    router.back();
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCamera = async () => {
    if (!isCameraOn && hasPermission === false) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Settings', 
            onPress: async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
              if (status === 'granted') {
                setIsCameraOn(true);
              }
            }
          }
        ]
      );
      return;
    }
    
    if (!isCameraOn && hasPermission === null) {
      // Request permission if not determined yet
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        setIsCameraOn(true);
      }
      return;
    }

    setIsCameraOn(!isCameraOn);
  };

  const handleLocation = async () => {
    if (!isLocationOn) {
      // Turning location ON - provide immediate feedback
      setIsLocationOn(true);
      setIsLocationLoading(true);
      
      if (hasLocationPermission === false) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {
              setIsLocationOn(false);
              setIsLocationLoading(false);
            }},
            { 
              text: 'Settings', 
              onPress: async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setHasLocationPermission(status === 'granted');
                if (status === 'granted') {
                  await getCurrentLocation();
                } else {
                  setIsLocationOn(false);
                  setIsLocationLoading(false);
                }
              }
            }
          ]
        );
        return;
      }
      
      if (hasLocationPermission === null) {
        // Request permission if not determined yet
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        if (status === 'granted') {
          await getCurrentLocation();
        } else {
          setIsLocationOn(false);
          setIsLocationLoading(false);
        }
        return;
      }

      // Permission already granted, get location
      if (hasLocationPermission === true) {
        await getCurrentLocation();
      }
    } else {
      // Turning location OFF
      setIsLocationOn(false);
      setIsLocationLoading(false);
      setCurrentLocation(null);
    }
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
        [{ text: 'OK', onPress: () => {
          setIsLocationOn(false);
        }}]
      );
    }
  };

  const handleVoice = async () => {
    if (!isVoiceOn) {
      // Turning voice ON - check permissions first
      if (hasAudioPermission === false) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use voice features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: async () => {
                const { status } = await Audio.requestPermissionsAsync();
                setHasAudioPermission(status === 'granted');
                if (status === 'granted') {
                  await enableVoice();
                }
              }
            }
          ]
        );
        return;
      }
      
      if (hasAudioPermission === null) {
        // Request permission if not determined yet
        const { status } = await Audio.requestPermissionsAsync();
        setHasAudioPermission(status === 'granted');
        if (status === 'granted') {
          await enableVoice();
        }
        return;
      }

      // Permission already granted, enable voice
      if (hasAudioPermission === true) {
        await enableVoice();
      }
    } else {
      // Turning voice OFF
      await disableVoice();
    }
  };

  const enableVoice = async () => {
    try {
      // Configure audio mode for live microphone use
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      setIsVoiceOn(true);
      console.log('Voice enabled - microphone is now active');
    } catch (error) {
      console.error('Failed to enable voice:', error);
      Alert.alert(
        'Voice Error',
        'Unable to enable microphone. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const disableVoice = async () => {
    try {
      // Reset audio mode to default
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      setIsVoiceOn(false);
      console.log('Voice disabled - microphone is now inactive');
    } catch (error) {
      console.error('Failed to disable voice:', error);
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

  const handleCameraReady = () => {
    setCameraReady(true);
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
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
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
      
      {/* Top Header Area with Gap */}
      <View style={[styles.headerArea, { paddingTop: insets.top }]}>
        {/* Left Side Controls (empty for now, but available for future use) */}
        <View style={styles.leftControls}>
        </View>

        {/* Live Indicator - Centered */}
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
        {isCameraOn && hasPermission ? (
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={handleCameraReady}
          >
            {/* Location Status Indicator - Close to top */}
            {isLocationOn && (
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
                      <MaterialIcons 
                        name="hourglass-empty" 
                        size={16} 
                        color="#FF9F0A" 
                      />
                    </Animated.View>
                  ) : (
                    <MaterialIcons 
                      name="location-on" 
                      size={16} 
                      color="#34C759" 
                    />
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
            )}

            {/* Voice Status Indicator - Below location */}
            {/* {isVoiceOn && (
              <View style={styles.voiceOverlay}>
                <View style={styles.voiceIndicator}>
                  <Animated.View style={{
                    transform: [{
                      scale: micPulseAnim,
                    }],
                  }}>
                    <MaterialIcons 
                      name="mic" 
                      size={16} 
                      color="#FF3B30" 
                    />
                  </Animated.View>
                  <Text style={styles.voiceText}>Microphone Active</Text>
                </View>
              </View>
            )} */}

            {/* Chat Message Overlay */}
            {isTranscriptionEnabled && (
              <View style={styles.chatOverlay}>
                <View style={styles.chatBubble}>
                  <Text style={styles.chatText}>
                    Okay, I see the white cord now. Is there anything specific you&apos;d like to ask about it?
                  </Text>
                </View>
              </View>
            )}

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
              <Text style={styles.cameraOffText}>
                {hasPermission === null ? 'Checking camera permissions...' : 'Camera is off'}
              </Text>
            </View>
            
            {/* Location Status Indicator - Close to top */}
            {isLocationOn && (
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
                      <MaterialIcons 
                        name="hourglass-empty" 
                        size={16} 
                        color="#FF9F0A" 
                      />
                    </Animated.View>
                  ) : (
                    <MaterialIcons 
                      name="location-on" 
                      size={16} 
                      color="#34C759" 
                    />
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
            )}

            {/* Voice Status Indicator - Below location */}
            {/* {isVoiceOn && (
              <View style={styles.voiceOverlay}>
                <View style={styles.voiceIndicator}>
                  <Animated.View style={{
                    transform: [{
                      scale: micPulseAnim,
                    }],
                  }}>
                    <MaterialIcons 
                      name="mic" 
                      size={16} 
                      color="#FF3B30" 
                    />
                  </Animated.View>
                  <Text style={styles.voiceText}>Microphone Active</Text>
                </View>
              </View>
            )} */}

            {/* Chat Message Overlay */}
            {isTranscriptionEnabled && (
              <View style={styles.chatOverlay}>
                <View style={styles.chatBubble}>
                  <Text style={styles.chatText}>
                    Okay, I see the white cord now. Is there anything specific you&apos;d like to ask about it?
                  </Text>
                </View>
              </View>
            )}

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
            {isLocationLoading ? (
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
                  color={isLocationOn ? "#000" : "white"} 
                />
              </Animated.View>
            ) : (
              <MaterialIcons 
                name={isLocationOn ? "location-on" : "location-off"} 
                size={24} 
                color={isLocationOn ? "#000" : "white"} 
              />
            )}
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
            <Animated.View style={{
              transform: [{
                scale: micPulseAnim,
              }],
            }}>
              <MaterialIcons 
                name={isVoiceOn ? "mic" : "mic-off"} 
                size={24} 
                color={isVoiceOn ? "#000" : "white"} 
              />
            </Animated.View>
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