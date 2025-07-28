import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RecordingState } from '../hooks/useSpeechToText';

interface ToggleButtonProps {
  isOn: boolean;
  onPress: () => void;
  iconOn: keyof typeof MaterialIcons.glyphMap;
  iconOff: keyof typeof MaterialIcons.glyphMap;
  label: string;
  isLoading?: boolean;
  rotateAnim?: Animated.Value;
  pulseAnim?: Animated.Value;
  isEndButton?: boolean;
}

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

interface SttButtonProps {
  recordingState: RecordingState;
  onPressIn: () => void;
  onPressOut: () => void;
  pulseAnim?: Animated.Value;
}

const SttButton = ({
  recordingState,
  onPressIn,
  onPressOut,
  pulseAnim
}: SttButtonProps) => {
  const getButtonStyle = () => {
    switch (recordingState) {
      case 'recording':
        return [styles.buttonBackground, styles.recordingButton];
      case 'processing':
        return [styles.buttonBackground, styles.processingButton];
      case 'error':
        return [styles.buttonBackground, styles.errorButton];
      default:
        return styles.buttonBackground;
    }
  };

  const getIcon = () => {
    switch (recordingState) {
      case 'recording':
        return 'stop';
      case 'processing':
        return 'hourglass-empty';
      case 'error':
        return 'error';
      default:
        return 'keyboard-voice';
    }
  };

  const getIconColor = () => {
    switch (recordingState) {
      case 'recording':
        return 'white';
      case 'processing':
        return '#000';
      case 'error':
        return 'white';
      default:
        return '#000';
    }
  };

  const getLabelText = () => {
    switch (recordingState) {
      case 'recording':
        return 'Recording...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Hold to Talk';
    }
  };

  const isDisabled = recordingState === 'processing';

  return (
    <TouchableOpacity
      style={styles.controlButton}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      disabled={isDisabled}
    >
      <View style={getButtonStyle()}>
        {recordingState === 'recording' && pulseAnim ? (
          <Animated.View style={{
            transform: [{ scale: pulseAnim }],
          }}>
            <MaterialIcons
              name={getIcon()}
              size={24}
              color={getIconColor()}
            />
          </Animated.View>
        ) : recordingState === 'processing' ? (
          <Animated.View style={{
            transform: [{
              rotate: pulseAnim?.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) || '0deg',
            }],
          }}>
            <MaterialIcons
              name={getIcon()}
              size={24}
              color={getIconColor()}
            />
          </Animated.View>
        ) : (
          <MaterialIcons
            name={getIcon()}
            size={24}
            color={getIconColor()}
          />
        )}
      </View>
      <Text style={styles.buttonLabel}>{getLabelText()}</Text>
    </TouchableOpacity>
  );
};

interface VideoCallControlsProps {
  isCameraOn: boolean;
  recordingState: RecordingState;
  onCameraPress: () => void;
  onSttPressIn: () => void;
  onSttPressOut: () => void;
  onEndCall: () => void;
  micPulseAnim?: Animated.Value;
}

export default function VideoCallControls({
  isCameraOn,
  recordingState,
  onCameraPress,
  onSttPressIn,
  onSttPressOut,
  onEndCall,
  micPulseAnim
}: VideoCallControlsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
      <ToggleButton
        isOn={isCameraOn}
        onPress={onCameraPress}
        iconOn="videocam"
        iconOff="videocam-off"
        label="Video"
      />
      <SttButton
        recordingState={recordingState}
        onPressIn={onSttPressIn}
        onPressOut={onSttPressOut}
        pulseAnim={micPulseAnim}
      />
      <ToggleButton
        isOn={false}
        onPress={onEndCall}
        iconOn="close"
        iconOff="close"
        label="End"
        isEndButton
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  processingButton: {
    backgroundColor: '#FFA500',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
});