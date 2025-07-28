import { Animated } from 'react-native';
// Import constants for consistent animation values
import { STT_CONFIG, SPRING_CONFIG } from '../constants/sttConstants';

export const createRotateAnimation = (animatedValue: Animated.Value, duration: number = 1000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    })
  );
};

export const createSlideAnimation = (
  animatedValue: Animated.Value, 
  toValue: number, 
  duration: number = 300
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
  });
};

export const createPulseAnimation = (animatedValue: Animated.Value, scale: number = 1.2) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: scale,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );
};

export const getRotateInterpolation = (animatedValue: Animated.Value) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

export const getSlideInterpolation = (
  animatedValue: Animated.Value, 
  fromValue: number, 
  toValue: number
) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [fromValue, toValue],
  });
};

// Button-specific animations
export const createScaleAnimation = (
  animatedValue: Animated.Value, 
  toValue: number, 
  duration: number = 150
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
  });
};

export const createBounceAnimation = (
  animatedValue: Animated.Value, 
  toValue: number, 
  duration: number = 300
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 300,
    friction: 10,
    useNativeDriver: true,
  });
};

export const createPressAnimation = (animatedValue: Animated.Value) => {
  return Animated.timing(animatedValue, {
    toValue: STT_CONFIG.SCALE.PRESSED,
    duration: STT_CONFIG.ANIMATION_DURATION.PRESS,
    useNativeDriver: true,
  });
};

export const createReleaseAnimation = (animatedValue: Animated.Value) => {
  return Animated.spring(animatedValue, {
    toValue: STT_CONFIG.SCALE.NORMAL,
    tension: SPRING_CONFIG.tension,
    friction: SPRING_CONFIG.friction,
    useNativeDriver: true,
  });
};

export const createRecordingPulseAnimation = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: STT_CONFIG.SCALE.PULSE_MAX,
        duration: STT_CONFIG.ANIMATION_DURATION.PULSE,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: STT_CONFIG.SCALE.NORMAL,
        duration: STT_CONFIG.ANIMATION_DURATION.PULSE,
        useNativeDriver: true,
      }),
    ])
  );
};

export const createGlowAnimation = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: STT_CONFIG.ANIMATION_DURATION.GLOW,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.3,
        duration: STT_CONFIG.ANIMATION_DURATION.GLOW,
        useNativeDriver: true,
      }),
    ])
  );
};

export const getScaleInterpolation = (animatedValue: Animated.Value) => {
  return animatedValue;
};

export const getGlowOpacityInterpolation = (animatedValue: Animated.Value) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
};