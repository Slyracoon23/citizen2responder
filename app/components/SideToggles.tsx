import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';
import * as Location from 'expo-location';

interface SideToggleButtonProps {
  isOn: boolean;
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  gradientColors: string[];
  isLoading?: boolean;
  rotateAnim?: Animated.Value;
}

const SideToggleButton = ({
  isOn,
  onPress,
  icon,
  label,
  gradientColors,
  isLoading,
  rotateAnim
}: SideToggleButtonProps) => (
  <TouchableOpacity
    style={styles.sideToggleButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.buttonContainer}>
      <LinearGradient
        colors={isOn ? gradientColors : colors.gradients.glass}
        style={[
          styles.buttonGradient,
          isOn && styles.buttonActive
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
              size={24}
              color={isOn ? colors.text.primary : colors.controls.inactive}
            />
          </Animated.View>
        ) : (
          <MaterialIcons
            name={icon}
            size={24}
            color={isOn ? colors.text.primary : colors.controls.inactive}
          />
        )}
      </LinearGradient>
    </View>
    <Text style={[
      styles.buttonLabel,
      isOn && styles.activeButtonLabel
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface LeftSideTogglesProps {
  isPreCareToggleOn: boolean;
  isGenerateReportOn: boolean;
  isTextInputVisible: boolean;
  onPreCareToggle: () => void;
  onGenerateReportToggle: () => void;
  onTextInputToggle: () => void;
}

export const LeftSideToggles = ({
  isPreCareToggleOn,
  isGenerateReportOn,
  isTextInputVisible,
  onPreCareToggle,
  onGenerateReportToggle,
  onTextInputToggle
}: LeftSideTogglesProps) => (
  <View style={styles.leftSideContainer}>
    <SideToggleButton
      isOn={isPreCareToggleOn}
      onPress={onPreCareToggle}
      icon="local-hospital"
      label="PRE-CARE"
      gradientColors={colors.gradients.secondary}
    />
    <SideToggleButton
      isOn={isGenerateReportOn}
      onPress={onGenerateReportToggle}
      icon="assignment"
      label="REPORT"
      gradientColors={colors.gradients.error}
    />
    <SideToggleButton
      isOn={isTextInputVisible}
      onPress={onTextInputToggle}
      icon={isTextInputVisible ? "keyboard" : "keyboard-hide"}
      label="CHAT"
      gradientColors={colors.gradients.accent}
    />
  </View>
);

interface RightSideTogglesProps {
  isImageInputEnabled: boolean;
  isQuestionToggleOn: boolean;
  isTranscriptionEnabled: boolean;
  isApiLoading: boolean;
  onImageInputToggle: () => void;
  onQuestionToggle: () => void;
  onTranscriptionToggle: () => void;
}

export const RightSideToggles = ({
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isApiLoading,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle
}: RightSideTogglesProps) => (
  <View style={styles.rightSideContainer}>
    <SideToggleButton
      isOn={isImageInputEnabled}
      onPress={onImageInputToggle}
      icon={isImageInputEnabled ? "visibility" : "visibility-off"}
      label="VISION"
      gradientColors={colors.gradients.secondary}
      isLoading={isApiLoading}
    />
    <SideToggleButton
      isOn={isQuestionToggleOn}
      onPress={onQuestionToggle}
      icon="quiz"
      label="QUESTIONS"
      gradientColors={colors.gradients.error}
    />
    <SideToggleButton
      isOn={isTranscriptionEnabled}
      onPress={onTranscriptionToggle}
      icon={isTranscriptionEnabled ? "closed-caption" : "closed-caption-disabled"}
      label="CAPTIONS"
      gradientColors={colors.gradients.primary}
    />
  </View>
);

const styles = StyleSheet.create({
  // Left side container
  leftSideContainer: {
    position: 'absolute',
    left: spacing.lg,
    top: '25%',
    zIndex: 1001,
    gap: spacing.lg,
  },
  
  // Right side container
  rightSideContainer: {
    position: 'absolute',
    right: spacing.lg,
    top: '25%',
    zIndex: 1001,
    gap: spacing.lg,
  },
  
  // Individual toggle button
  sideToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 30,
  },
  
  buttonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.glass.light,
  },
  
  buttonActive: {
    borderColor: colors.glass.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 8,
  },
  
  buttonLabel: {
    color: colors.text.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  activeButtonLabel: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
});