import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, shadows } from '../constants/theme';
import * as Location from 'expo-location';

interface LocationDisplayProps {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
}

const LocationDisplay = ({ isLocationOn, isLocationLoading, currentLocation, rotateAnim }: LocationDisplayProps) => {
  if (!isLocationOn) return null;

  return (
    <View style={styles.modernLocationContainer}>
      <LinearGradient
        colors={colors.gradients.glass}
        style={styles.locationGradient}
      >
        {isLocationLoading ? (
          <Animated.View style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          }}>
            <MaterialIcons name="hourglass-empty" size={16} color={colors.warning} />
          </Animated.View>
        ) : (
          <MaterialIcons name="location-on" size={16} color={colors.success} />
        )}
        <Text style={styles.modernLocationText}>
          {isLocationLoading
            ? "Getting..."
            : currentLocation
              ? `${currentLocation.coords.latitude.toFixed(2)}, ${currentLocation.coords.longitude.toFixed(2)}`
              : "Location"
          }
        </Text>
      </LinearGradient>
    </View>
  );
};

interface LeftControlsProps {
  isGenerateReportOn: boolean;
  isPreCareToggleOn: boolean;
  onGenerateReportToggle: () => void;
  onPreCareToggle: () => void;
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
}

const LeftControls = ({ 
  isGenerateReportOn,
  isPreCareToggleOn,
  onGenerateReportToggle,
  onPreCareToggle,
  isLocationOn,
  isLocationLoading,
  currentLocation,
  rotateAnim
}: LeftControlsProps) => (
  <View style={styles.leftControls}>
    <LocationDisplay
      isLocationOn={isLocationOn}
      isLocationLoading={isLocationLoading}
      currentLocation={currentLocation}
      rotateAnim={rotateAnim}
    />
    <TouchableOpacity
      style={styles.modernToggle}
      onPress={onPreCareToggle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isPreCareToggleOn 
          ? colors.gradients.secondary 
          : colors.gradients.glass
        }
        style={[
          styles.toggleGradient,
          isPreCareToggleOn && styles.toggleActive
        ]}
      >
        <MaterialIcons
          name="local-hospital"
          size={22}
          color={isPreCareToggleOn ? colors.text.primary : colors.controls.inactive}
        />
      </LinearGradient>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.modernToggle}
      onPress={onGenerateReportToggle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isGenerateReportOn 
          ? colors.gradients.error 
          : colors.gradients.glass
        }
        style={[
          styles.toggleGradient,
          isGenerateReportOn && styles.toggleActive
        ]}
      >
        <MaterialIcons
          name="assignment"
          size={22}
          color={isGenerateReportOn ? colors.text.primary : colors.controls.inactive}
        />
      </LinearGradient>
    </TouchableOpacity>
  </View>
);


interface RightControlsProps {
  isImageInputEnabled: boolean;
  isQuestionToggleOn: boolean;
  isTranscriptionEnabled: boolean;
  isApiLoading: boolean;
  onImageInputToggle: () => void;
  onQuestionToggle: () => void;
  onTranscriptionToggle: () => void;
}

const RightControls = ({
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isApiLoading,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle
}: RightControlsProps) => (
  <View style={styles.rightControls}>
    <TouchableOpacity
      style={styles.modernToggle}
      onPress={onImageInputToggle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isImageInputEnabled 
          ? colors.gradients.secondary 
          : colors.gradients.glass
        }
        style={[
          styles.toggleGradient,
          isImageInputEnabled && styles.toggleActive,
          isApiLoading && styles.toggleLoading
        ]}
      >
        <MaterialIcons
          name={isImageInputEnabled ? "visibility" : "visibility-off"}
          size={22}
          color={isApiLoading 
            ? colors.accent 
            : isImageInputEnabled 
              ? colors.text.primary 
              : colors.controls.inactive
          }
        />
      </LinearGradient>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.modernToggle}
      onPress={onQuestionToggle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isQuestionToggleOn 
          ? colors.gradients.error 
          : colors.gradients.glass
        }
        style={[
          styles.toggleGradient,
          isQuestionToggleOn && styles.toggleActive
        ]}
      >
        <MaterialIcons
          name="quiz"
          size={22}
          color={isQuestionToggleOn ? colors.text.primary : colors.controls.inactive}
        />
      </LinearGradient>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.modernToggle}
      onPress={onTranscriptionToggle}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isTranscriptionEnabled 
          ? colors.gradients.primary 
          : colors.gradients.glass
        }
        style={[
          styles.toggleGradient,
          isTranscriptionEnabled && styles.toggleActive
        ]}
      >
        <MaterialIcons
          name={isTranscriptionEnabled ? "closed-caption" : "closed-caption-disabled"}
          size={22}
          color={isTranscriptionEnabled ? colors.text.primary : colors.controls.inactive}
        />
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

interface HeaderProps {
  isImageInputEnabled: boolean;
  isQuestionToggleOn: boolean;
  isTranscriptionEnabled: boolean;
  isGenerateReportOn: boolean;
  isPreCareToggleOn: boolean;
  isApiLoading: boolean;
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
  onImageInputToggle: () => void;
  onQuestionToggle: () => void;
  onTranscriptionToggle: () => void;
  onGenerateReportToggle: () => void;
  onPreCareToggle: () => void;
}

export default function Header({
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isGenerateReportOn,
  isPreCareToggleOn,
  isApiLoading,
  isLocationOn,
  isLocationLoading,
  currentLocation,
  rotateAnim,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle,
  onGenerateReportToggle,
  onPreCareToggle
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerArea, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={colors.gradients.darkGlass}
          style={styles.headerGradient}
        >
          <LeftControls
            isGenerateReportOn={isGenerateReportOn}
            isPreCareToggleOn={isPreCareToggleOn}
            onGenerateReportToggle={onGenerateReportToggle}
            onPreCareToggle={onPreCareToggle}
            isLocationOn={isLocationOn}
            isLocationLoading={isLocationLoading}
            currentLocation={currentLocation}
            rotateAnim={rotateAnim}
          />
          <RightControls
            isImageInputEnabled={isImageInputEnabled}
            isQuestionToggleOn={isQuestionToggleOn}
            isTranscriptionEnabled={isTranscriptionEnabled}
            isApiLoading={isApiLoading}
            onImageInputToggle={onImageInputToggle}
            onQuestionToggle={onQuestionToggle}
            onTranscriptionToggle={onTranscriptionToggle}
          />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main header container
  headerArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 1000,
  },
  headerContainer: {
    borderRadius: spacing.button.medium.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.button.medium.radius,
  },
  
  // Controls containers
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'flex-end',
    flex: 1,
  },
  
  // Location display
  modernLocationContainer: {
    borderRadius: spacing.button.small.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.button.small.radius,
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  modernLocationText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
  
  // Modern toggle buttons
  modernToggle: {
    borderRadius: spacing.button.medium.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  toggleGradient: {
    width: 48,
    height: 48,
    borderRadius: spacing.button.medium.radius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.light,
  },
  toggleActive: {
    borderColor: colors.glass.strong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleLoading: {
    borderColor: colors.accent,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
});