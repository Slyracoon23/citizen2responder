import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

interface HeaderProps {
  // Header now only displays logo - no props needed
}

export default function Header({}: HeaderProps) {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Logo styles
  logo: {
    height: 32,
    width: 120,
  },
});