import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSttButtonAnimations } from '../hooks/useSttButtonAnimations';
import { STT_CONFIG, STT_BUTTON_STATES } from '../constants/sttConstants';
import { colors, spacing, fontSize, fontWeight, shadows, animations } from '../constants/theme';
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
  <TouchableOpacity style={styles.controlButton} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.buttonContainer}>
      <LinearGradient
        colors={isEndButton 
          ? colors.gradients.error 
          : isOn 
            ? colors.gradients.gray
            : colors.gradients.gray
        }
        style={[
          styles.modernButton,
          isEndButton && styles.endCallButton,
        ]}
      >
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
              size={28}
              color={isOn && !isEndButton ? colors.text.inverse : colors.text.primary}
            />
          </Animated.View>
        ) : pulseAnim ? (
          <Animated.View style={{
            transform: [{ scale: pulseAnim }],
          }}>
            <MaterialIcons
              name={isOn ? iconOn : iconOff}
              size={28}
              color={isOn && !isEndButton ? colors.text.inverse : colors.text.primary}
            />
          </Animated.View>
        ) : (
          <MaterialIcons
            name={isOn ? iconOn : iconOff}
            size={28}
            color={isOn && !isEndButton ? colors.text.inverse : colors.text.primary}
          />
        )}
      </LinearGradient>
    </View>
    <Text style={[
      styles.buttonLabel,
      isEndButton && styles.endButtonLabel,
      isOn && !isEndButton && styles.activeButtonLabel
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Compact toggle button for control panel
interface CompactToggleButtonProps {
  isOn: boolean;
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  gradientColors: string[];
}

const CompactToggleButton = ({
  isOn,
  onPress,
  icon,
  label,
  gradientColors
}: CompactToggleButtonProps) => (
  <TouchableOpacity
    style={styles.compactToggleButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={isOn ? gradientColors : colors.gradients.gray}
      style={[
        styles.compactButtonGradient,
        isOn && styles.compactButtonActive
      ]}
    >
      <MaterialIcons
        name={icon}
        size={18}
        color={isOn ? colors.text.primary : colors.controls.inactive}
      />
    </LinearGradient>
    <Text style={[
      styles.compactButtonLabel,
      isOn && styles.compactActiveButtonLabel
    ]}>
      {label}
    </Text>
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
            size={32}
            color={buttonConfig.iconColor}
          />
        </Animated.View>
      );
    }

    return (
      <MaterialIcons
        name={buttonConfig.icon as any}
        size={32}
        color={buttonConfig.iconColor}
      />
    );
  };

  return (
    <View style={styles.sttControlButton}>
      {/* Enhanced glow effect for recording state */}
      {recordingState === 'recording' && (
        <Animated.View style={[styles.sttGlowEffect, getGlowStyle()]} />
      )}
      
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={buttonConfig.isDisabled}
        activeOpacity={0.9}
        style={styles.sttTouchable}
      >
        <Animated.View 
          style={[
            styles.sttButtonContainer,
            {
              transform: [
                {
                  scale: recordingState === 'recording' && pulseAnim
                    ? pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [1, 1.1],
                        extrapolate: 'clamp',
                      })
                    : 1
                }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={recordingState === 'recording' 
              ? colors.gradients.error
              : recordingState === 'processing'
                ? colors.gradients.warning
                : colors.gradients.gray
            }
            style={styles.sttModernButton}
          >
            <View style={styles.sttInnerButton}>
              {renderIcon()}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
      
      <Text style={[
        styles.sttButtonLabel,
        recordingState === 'recording' && styles.sttRecordingLabel,
        recordingState === 'processing' && styles.sttProcessingLabel
      ]}>
        {buttonConfig.label}
      </Text>
    </View>
  );
};

interface VideoCallControlsProps {
  isKeyboardOn: boolean;
  recordingState: RecordingState;
  onKeyboardPress: () => void;
  onSttPressIn: () => void;
  onSttPressOut: () => void;
  onEndCall: () => void;
  micPulseAnim?: Animated.Value;
  // Toggle props
  isCareToggleOn: boolean;
  isGenerateReportOn: boolean;
  isQuestionToggleOn: boolean;
  onCareConfirm: () => void;
  onGenerateReportConfirm: () => void;
  onAssessConfirm: () => void;
}

export default function VideoCallControls({
  isKeyboardOn,
  recordingState,
  onKeyboardPress,
  onSttPressIn,
  onSttPressOut,
  onEndCall,
  micPulseAnim,
  isCareToggleOn,
  isGenerateReportOn,
  isQuestionToggleOn,
  onCareConfirm,
  onGenerateReportConfirm,
  onAssessConfirm
}: VideoCallControlsProps) {
  const insets = useSafeAreaInsets();

  const handleReportToggle = () => {
    if (isGenerateReportOn) {
      onGenerateReportConfirm();
    } else {
      Alert.alert(
        "Generate Report",
        "Would you like to generate an emergency report? The system will ask you a few questions to create a comprehensive report.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Generate Report",
            onPress: onGenerateReportConfirm
          }
        ]
      );
    }
  };

  const handleCareToggle = () => {
    Alert.alert(
      "Care Instructions",
      "Would you like to access care instructions? The system will provide emergency care guidance based on the situation.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Get Instructions",
          onPress: onCareConfirm
        }
      ]
    );
  };

  const handleAssessToggle = () => {
    if (isQuestionToggleOn) {
      // If already on, turn it off
      onAssessConfirm(); // This will be used to toggle off
    } else {
      // If off, show confirmation to turn on
      Alert.alert(
        "Assessment Mode",
        "Would you like to activate assessment mode? The system will guide you through questions to evaluate the emergency situation.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Start Assessment",
            onPress: onAssessConfirm
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.controlsBackground}>
        <LinearGradient
          colors={colors.gradients.darkGlass}
          style={styles.controlsGradient}
        >
          {/* Toggle buttons row at the top */}
          <View style={styles.togglesRow}>
            <CompactToggleButton
              isOn={isQuestionToggleOn}
              onPress={handleAssessToggle}
              icon="quiz"
              label="ASSESS"
              gradientColors={colors.gradients.primary}
            />
            <CompactToggleButton
              isOn={isGenerateReportOn}
              onPress={handleReportToggle}
              icon="assignment"
              label="REPORT"
              gradientColors={colors.gradients.error}
            />
            <CompactToggleButton
              isOn={isCareToggleOn}
              onPress={handleCareToggle}
              icon="local-hospital"
              label="CARE"
              gradientColors={colors.gradients.secondary}
            />
          </View>

          {/* Main controls row at the bottom */}
          <View style={styles.controlsContent}>
            <ToggleButton
              isOn={isKeyboardOn}
              onPress={onKeyboardPress}
              iconOn="keyboard"
              iconOff="keyboard"
              label="Keyboard"
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
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  controlsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  controlsBackground: {
    borderRadius: spacing.button.large.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlsGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: spacing.button.large.radius,
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xxxl,
  },
  
  // Standard button styles
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: spacing.button.large.radius,
  },
  modernButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.glass.light,
  },
  endCallButton: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonLabel: {
    color: colors.text.primary,
    fontSize: fontSize.control.label,
    marginTop: spacing.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  activeButtonLabel: {
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
  endButtonLabel: {
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  
  // STT Button styles
  sttControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sttButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 45,
  },
  sttModernButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.glass.strong,
  },
  sttInnerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sttTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sttGlowEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.error,
    opacity: 0.3,
    top: -15,
    alignSelf: 'center',
    zIndex: -1,
  },
  sttButtonLabel: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    marginTop: spacing.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  sttRecordingLabel: {
    color: colors.error,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xl,
  },
  sttProcessingLabel: {
    color: colors.warning,
    fontWeight: fontWeight.semibold,
  },

  // Compact toggle button styles
  compactToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
  },
  compactButtonGradient: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.glass.light,
  },
  compactButtonActive: {
    borderColor: colors.glass.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactButtonLabel: {
    color: colors.text.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  compactActiveButtonLabel: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
});