import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type ChatOverlayProps = { isTranscriptionEnabled: boolean };
const ChatOverlay = ({ isTranscriptionEnabled }: ChatOverlayProps) => (
  isTranscriptionEnabled ? (
    <View style={styles.chatOverlay}>
      <View style={styles.chatBubble}>
        <Text style={styles.chatText}>
          Okay, I see the white cord now. Is there anything specific you&apos;d like to ask about it?
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
type AllOverlaysProps = {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
  isTranscriptionEnabled: boolean;
  isQuestionToggleOn: boolean;
  slideAnim: Animated.Value;
  currentQuestion: string;
  handleQuestionResponse: (response: 'yes' | 'no' | 'dont-know') => void;
};
const AllOverlays = (props: AllOverlaysProps) => (
  <>
    <LocationOverlay 
      isLocationOn={props.isLocationOn} 
      isLocationLoading={props.isLocationLoading} 
      currentLocation={props.currentLocation} 
      rotateAnim={props.rotateAnim} 
    />
    <ChatOverlay isTranscriptionEnabled={props.isTranscriptionEnabled} />
    <QuestionPopover 
      isQuestionToggleOn={props.isQuestionToggleOn} 
      slideAnim={props.slideAnim} 
      currentQuestion={props.currentQuestion} 
      handleQuestionResponse={props.handleQuestionResponse} 
    />
  </>
);

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
  const [isLocationOn, setIsLocationOn] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [isQuestionToggleOn, setIsQuestionToggleOn] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Does the person appear to have chest pain?");
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  const [hasPermission, requestCameraPermission] = usePermission(Camera.requestCameraPermissionsAsync);
  const [hasLocationPermission, requestLocationPermission] = usePermission(Location.requestForegroundPermissionsAsync);
  const [hasAudioPermission, requestAudioPermission] = usePermission(Audio.requestPermissionsAsync);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

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

  const handleEndCall = () => {
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

  const handleLocation = async () => {
    await handleToggleFeature({
      isOn: isLocationOn,
      setIsOn: setIsLocationOn,
      hasPermission: hasLocationPermission,
      requestPermission: requestLocationPermission,
      onEnable: async () => {
        setIsLocationLoading(true);
        await getCurrentLocation();
      },
      onDisable: async () => {
        setIsLocationLoading(false);
        setCurrentLocation(null);
      },
      alertTitle: 'Location Permission Required',
      alertMessage: 'Please enable location access in your device settings to use this feature.',
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

  const handleQuestionResponse = (response: 'yes' | 'no' | 'dont-know') => {
    console.log('Question response:', response);
    setIsQuestionToggleOn(false);
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
        <View style={styles.leftControls} />
        <View style={styles.liveIndicator}>
          <View style={styles.liveContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <View style={styles.rightControls}>
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
          isLocationOn={isLocationOn}
          isLocationLoading={isLocationLoading}
          currentLocation={currentLocation}
          rotateAnim={rotateAnim}
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
          isOn={isLocationOn}
          onPress={handleLocation}
          iconOn="location-on"
          iconOff="location-off"
          label="Location"
          isLoading={isLocationLoading}
          rotateAnim={rotateAnim}
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