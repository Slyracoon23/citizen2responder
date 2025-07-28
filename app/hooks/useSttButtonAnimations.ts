import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  createPressAnimation,
  createReleaseAnimation,
  createRecordingPulseAnimation,
  createGlowAnimation,
  getScaleInterpolation,
  getGlowOpacityInterpolation,
} from '../services/animationUtils';
import { STT_CONFIG } from '../constants/sttConstants';
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
    
    // Scale down animation
    createPressAnimation(scaleAnim).start();
  }, [scaleAnim]);

  const animateRelease = useCallback(async () => {
    // Haptic feedback for release
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Bounce back animation
    createReleaseAnimation(scaleAnim).start();
  }, [scaleAnim]);

  const startRecordingAnimation = useCallback(() => {
    // Start recording pulse animation
    recordingAnimationRef.current = createRecordingPulseAnimation(recordingPulseAnim);
    recordingAnimationRef.current.start();

    // Start glow animation
    glowAnimationRef.current = createGlowAnimation(glowAnim);
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

  const getButtonStyle = useCallback((recordingState: RecordingState) => {
    const baseTransform = [
      { scale: getScaleInterpolation(scaleAnim) }
    ];

    if (recordingState === 'recording') {
      baseTransform.push({ scale: getScaleInterpolation(recordingPulseAnim) });
    }

    return {
      transform: baseTransform
    };
  }, [scaleAnim, recordingPulseAnim]);

  const getGlowStyle = useCallback(() => ({
    opacity: getGlowOpacityInterpolation(glowAnim),
  }), [glowAnim]);

  return {
    scaleAnim,
    glowAnim,
    recordingPulseAnim,
    animatePress,
    animateRelease,
    startRecordingAnimation,
    stopRecordingAnimation,
    getButtonStyle,
    getGlowStyle,
  };
}