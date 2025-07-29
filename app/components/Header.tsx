import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
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




interface HeaderProps {
  isLocationOn: boolean;
  isLocationLoading: boolean;
  currentLocation: Location.LocationObject | null;
  rotateAnim: Animated.Value;
}

export default function Header({
  isLocationOn,
  isLocationLoading,
  currentLocation,
  rotateAnim
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerArea, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={colors.gradients.darkGlass}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/images/logo-transparent-with-white-text-and-full-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <LocationDisplay
              isLocationOn={isLocationOn}
              isLocationLoading={isLocationLoading}
              currentLocation={currentLocation}
              rotateAnim={rotateAnim}
            />
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.button.medium.radius,
  },
  
  // Header content container
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  
  // Logo styles
  logo: {
    height: 32,
    width: 120,
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
});