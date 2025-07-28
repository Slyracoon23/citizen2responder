import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface VideoCallControlsProps {
  isCameraOn: boolean;
  isVoiceOn: boolean;
  onCameraPress: () => void;
  onVoicePress: () => void;
  onEndCall: () => void;
  micPulseAnim?: Animated.Value;
}

export default function VideoCallControls({
  isCameraOn,
  isVoiceOn,
  onCameraPress,
  onVoicePress,
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
      <ToggleButton
        isOn={isVoiceOn}
        onPress={onVoicePress}
        iconOn="mic"
        iconOff="mic-off"
        label="Voice"
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
});