import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

interface LocationDisplayProps {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
}

const LocationDisplay = ({ isLocationOn, isLocationLoading, currentLocation, rotateAnim }: LocationDisplayProps) => {
  if (!isLocationOn) return <View style={styles.leftControls} />;

  return (
    <View style={styles.leftControls}>
      <View style={styles.headerLocationContainer}>
        {isLocationLoading ? (
          <Animated.View style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          }}>
            <MaterialIcons name="hourglass-empty" size={14} color="#FF9F0A" />
          </Animated.View>
        ) : (
          <MaterialIcons name="location-on" size={14} color="#34C759" />
        )}
        <Text style={styles.headerLocationText}>
          {isLocationLoading
            ? "Getting..."
            : currentLocation
              ? `${currentLocation.coords.latitude.toFixed(2)}, ${currentLocation.coords.longitude.toFixed(2)}`
              : "Location"
          }
        </Text>
      </View>
    </View>
  );
};

const LiveIndicator = () => (
  <View style={styles.liveIndicator}>
    <View style={styles.liveContainer}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>Live</Text>
    </View>
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
      style={[
        styles.headerToggle,
        isImageInputEnabled && styles.headerToggleActive,
        isApiLoading && { backgroundColor: 'rgba(52, 199, 89, 0.3)' }
      ]}
      onPress={onImageInputToggle}
    >
      <MaterialIcons
        name={isImageInputEnabled ? "visibility" : "visibility-off"}
        size={24}
        color={isApiLoading ? "#FFD600" : isImageInputEnabled ? "#34C759" : "white"}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.headerToggle, isQuestionToggleOn && styles.headerToggleActive]}
      onPress={onQuestionToggle}
    >
      <MaterialIcons
        name="quiz"
        size={24}
        color={isQuestionToggleOn ? "#FF3B30" : "white"}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.headerToggle}
      onPress={onTranscriptionToggle}
    >
      <MaterialIcons
        name={isTranscriptionEnabled ? "closed-caption" : "closed-caption-disabled"}
        size={24}
        color="white"
      />
    </TouchableOpacity>
  </View>
);

interface HeaderProps {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
  isImageInputEnabled: boolean;
  isQuestionToggleOn: boolean;
  isTranscriptionEnabled: boolean;
  isApiLoading: boolean;
  onImageInputToggle: () => void;
  onQuestionToggle: () => void;
  onTranscriptionToggle: () => void;
}

export default function Header({
  isLocationOn,
  isLocationLoading,
  currentLocation,
  rotateAnim,
  isImageInputEnabled,
  isQuestionToggleOn,
  isTranscriptionEnabled,
  isApiLoading,
  onImageInputToggle,
  onQuestionToggle,
  onTranscriptionToggle
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerArea, { paddingTop: insets.top }]}>
      <LocationDisplay
        isLocationOn={isLocationOn}
        isLocationLoading={isLocationLoading}
        currentLocation={currentLocation}
        rotateAnim={rotateAnim}
      />
      <LiveIndicator />
      <RightControls
        isImageInputEnabled={isImageInputEnabled}
        isQuestionToggleOn={isQuestionToggleOn}
        isTranscriptionEnabled={isTranscriptionEnabled}
        isApiLoading={isApiLoading}
        onImageInputToggle={onImageInputToggle}
        onQuestionToggle={onQuestionToggle}
        onTranscriptionToggle={onTranscriptionToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  leftControls: {
    width: 142,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerLocationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
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
    width: 142,
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
});