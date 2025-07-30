import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  isCareToggleOn: boolean;
  isGenerateReportOn: boolean;
  onCareConfirm: () => void;
  onGenerateReportConfirm: () => void;
  isQuestionToggleOn: boolean;
  onAssessConfirm: () => void;
}

export const LeftSideToggles = ({
  isCareToggleOn,
  isGenerateReportOn,
  onCareConfirm,
  onGenerateReportConfirm,
  isQuestionToggleOn,
  onAssessConfirm
}: LeftSideTogglesProps) => {
  const handleReportToggle = () => {
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
    <View style={styles.leftSideContainer}>
      <SideToggleButton
        isOn={isQuestionToggleOn}
        onPress={handleAssessToggle}
        icon="quiz"
        label="ASSESS"
        gradientColors={colors.gradients.primary}
      />
      <SideToggleButton
        isOn={isGenerateReportOn}
        onPress={handleReportToggle}
        icon="assignment"
        label="REPORT"
        gradientColors={colors.gradients.error}
      />
      <SideToggleButton
        isOn={isCareToggleOn}
        onPress={handleCareToggle}
        icon="local-hospital"
        label="CARE"
        gradientColors={colors.gradients.secondary}
      />
    </View>
  );
};

interface RightSideTogglesProps {
  isImageInputEnabled: boolean;
  isQuestionToggleOn: boolean;
  isTranscriptionEnabled: boolean;
  isApiLoading: boolean;
  onImageInputToggle: () => void;
  onQuestionToggle: () => void;
  onTranscriptionToggle: () => void;
  isCareToggleOn: boolean;
  isGenerateReportOn: boolean;
  onCareConfirm: () => void;
  onGenerateReportConfirm: () => void;
}

export const RightSideToggles = ({
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isApiLoading,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle,
  isCareToggleOn,
  isGenerateReportOn,
  onCareConfirm,
  onGenerateReportConfirm
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
    top: '35%',
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