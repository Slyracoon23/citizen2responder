import { Animated } from 'react-native';

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