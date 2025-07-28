import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSttButtonAnimations } from '../hooks/useSttButtonAnimations';
import { STT_CONFIG, STT_BUTTON_STATES } from '../constants/sttConstants';
import type { RecordingState } from '../hooks/useSpeechToText';
import type { SttButtonProps } from '../types/stt';

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


const SttButton = ({
  recordingState,
  onPressIn,
  onPressOut,
  pulseAnim
}: SttButtonProps) => {
  const {
    animatePress,
    animateRelease,
    startRecordingAnimation,
    stopRecordingAnimation,
    getButtonStyle: getAnimatedButtonStyle,
    getGlowStyle,
  } = useSttButtonAnimations();

  // Get current button configuration based on state
  const buttonConfig = useMemo(() => STT_BUTTON_STATES[recordingState], [recordingState]);

  // Handle recording state changes
  useEffect(() => {
    if (recordingState === 'recording') {
      startRecordingAnimation();
    } else if (recordingState === 'idle' || recordingState === 'processing') {
      stopRecordingAnimation();
    }
  }, [recordingState, startRecordingAnimation, stopRecordingAnimation]);

  // Memoize styles for better performance
  const buttonBackgroundStyle = useMemo(() => [
    styles.sttButtonBackground,
    { backgroundColor: buttonConfig.backgroundColor }
  ], [buttonConfig.backgroundColor]);

  const labelStyle = useMemo(() => [
    styles.buttonLabel,
    recordingState === 'recording' && styles.recordingLabel
  ], [recordingState]);

  const handlePressIn = () => {
    if (!buttonConfig.isDisabled) {
      animatePress();
      onPressIn();
    }
  };

  const handlePressOut = () => {
    if (!buttonConfig.isDisabled) {
      animateRelease();
      onPressOut();
    }
  };

  const renderIcon = () => {
    if (recordingState === 'processing' && pulseAnim) {
      return (
        <Animated.View style={{
          transform: [{
            rotate: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }],
        }}>
          <MaterialIcons
            name={buttonConfig.icon as any}
            size={STT_CONFIG.ICON_SIZE}
            color={buttonConfig.iconColor}
          />
        </Animated.View>
      );
    }

    return (
      <MaterialIcons
        name={buttonConfig.icon as any}
        size={STT_CONFIG.ICON_SIZE}
        color={buttonConfig.iconColor}
      />
    );
  };

  return (
    <View style={styles.sttControlButton}>
      {/* Glow effect for recording state */}
      {recordingState === 'recording' && (
        <Animated.View style={[styles.glowEffect, getGlowStyle()]} />
      )}
      
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={buttonConfig.isDisabled}
        activeOpacity={0.8}
        style={styles.sttTouchable}
      >
        <Animated.View style={[
          buttonBackgroundStyle,
          getAnimatedButtonStyle(recordingState)
        ]}>
          {renderIcon()}
        </Animated.View>
      </TouchableOpacity>
      
      <Text style={labelStyle}>
        {buttonConfig.label}
      </Text>
    </View>
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
  sttButtonBackground: {
    width: STT_CONFIG.BUTTON_SIZE,
    height: STT_CONFIG.BUTTON_SIZE,
    borderRadius: STT_CONFIG.BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: STT_CONFIG.SHADOW.COLOR,
    shadowOffset: STT_CONFIG.SHADOW.OFFSET,
    shadowOpacity: STT_CONFIG.SHADOW.OPACITY,
    shadowRadius: STT_CONFIG.SHADOW.RADIUS,
    elevation: STT_CONFIG.SHADOW.ELEVATION,
  },
  glowEffect: {
    position: 'absolute',
    width: STT_CONFIG.GLOW_SIZE,
    height: STT_CONFIG.GLOW_SIZE,
    borderRadius: STT_CONFIG.GLOW_SIZE / 2,
    backgroundColor: STT_CONFIG.COLORS.RECORDING,
    top: -(STT_CONFIG.GLOW_SIZE - STT_CONFIG.BUTTON_SIZE) / 2,
    alignSelf: 'center',
    zIndex: -1,
  },
  recordingLabel: {
    color: STT_CONFIG.COLORS.RECORDING,
    fontWeight: '600',
  },
  sttControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sttTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});