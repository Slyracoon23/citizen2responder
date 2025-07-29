import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../constants/theme';

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
        colors={isOn ? gradientColors : colors.gradients.gray}
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
  onPreCareToggle: () => void;
  onGenerateReportToggle: () => void;
  isQuestionToggleOn: boolean;
  onQuestionToggle: () => void;
}

export const LeftSideToggles = ({
  isPreCareToggleOn,
  isGenerateReportOn,
  onPreCareToggle,
  onGenerateReportToggle,
  isQuestionToggleOn,
  onQuestionToggle
}: LeftSideTogglesProps) => (
  <View style={styles.leftSideContainer}>
    <SideToggleButton
      isOn={isQuestionToggleOn}
      onPress={onQuestionToggle}
      icon="quiz"
      label="ASSESS"
      gradientColors={colors.gradients.error}
    />
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
  isPreCareToggleOn: boolean;
  isGenerateReportOn: boolean;
  onPreCareToggle: () => void;
  onGenerateReportToggle: () => void;
}

export const RightSideToggles = ({
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isApiLoading,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle,
  isPreCareToggleOn,
  isGenerateReportOn,
  onPreCareToggle,
  onGenerateReportToggle
}: RightSideTogglesProps) => (
  <View style={styles.rightSideContainer}>
    {/* Right side is now empty - vision and captions always on */}
  </View>
);

const styles = StyleSheet.create({
  // Left side container
  leftSideContainer: {
    position: 'absolute',
    left: spacing.lg,
    top: '38%',
    zIndex: 1001,
    gap: spacing.lg,
  },
  
  // Right side container
  rightSideContainer: {
    position: 'absolute',
    right: spacing.lg,
    top: '40%',
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