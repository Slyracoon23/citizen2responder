import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { RecordingState } from './useSpeechToText';
import type { UseSttButtonReturn } from '../types/stt';

export function useSttButtonAnimations(): UseSttButtonReturn {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const recordingPulseAnim = useRef(new Animated.Value(1)).current;
  
  const recordingAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const animatePress = useCallback(async () => {
    // Haptic feedback for press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simple scale down animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const animateRelease = useCallback(async () => {
    // Haptic feedback for release
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simple bounce back animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const startRecordingAnimation = useCallback(() => {
    // Simple recording pulse animation
    recordingAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(recordingPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    recordingAnimationRef.current.start();

    // Simple glow animation
    glowAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimationRef.current.start();
  }, [recordingPulseAnim, glowAnim]);

  const stopRecordingAnimation = useCallback(() => {
    // Stop recording animations
    if (recordingAnimationRef.current) {
      recordingAnimationRef.current.stop();
      recordingAnimationRef.current = null;
    }

    if (glowAnimationRef.current) {
      glowAnimationRef.current.stop();
      glowAnimationRef.current = null;
    }

    // Reset animation values
    Animated.timing(recordingPulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [recordingPulseAnim, glowAnim]);

  // Simplified style getters that return proper values
  const getPressScale = useCallback(() => {
    return scaleAnim;
  }, [scaleAnim]);

  const getRecordingScale = useCallback(() => {
    return recordingPulseAnim;
  }, [recordingPulseAnim]);

  const getGlowStyle = useCallback(() => ({
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.6],
      extrapolate: 'clamp',
    }),
  }), [glowAnim]);

  return {
    scaleAnim,
    glowAnim,
    recordingPulseAnim,
    animatePress,
    animateRelease,
    startRecordingAnimation,
    stopRecordingAnimation,
    getPressScale,
    getRecordingScale,
    getGlowStyle,
  };
}