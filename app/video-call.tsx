import { MaterialIcons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
  const insets = useSafeAreaInsets();

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

        {/* Transcription Toggle */}
        <TouchableOpacity 
          style={styles.transcriptionToggle}
          onPress={handleToggleTranscription}
        >
          <MaterialIcons 
            name={isTranscriptionEnabled ? "closed-caption" : "closed-caption-disabled"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
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
  transcriptionToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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