import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { animations } from '../constants/theme';
import { 
  createSlideAnimation, 
  createRotateAnimation, 
  createPulseAnimation,
  getRotateInterpolation,
  getSlideInterpolation 
} from '../services/animationUtils';

export function useAnimations() {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Enhanced slide animation with easing
  const startSlideAnimation = (toValue: number) => {
    Animated.timing(slideAnim, {
      toValue,
      duration: animations.normal,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Enhanced rotate animation
  const startRotateAnimation = () => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: animations.slow * 3,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return animation;
  };

  // Enhanced pulse animation
  const startPulseAnimation = () => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, {
          toValue: 1.2,
          duration: animations.normal,
          easing: Easing.out(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: animations.normal,
          easing: Easing.in(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return animation;
  };

  // New fade animation
  const startFadeAnimation = (toValue: number, duration: number = animations.normal) => {
    return Animated.timing(fadeAnim, {
      toValue,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
  };

  // New scale animation for button press feedback
  const startScaleAnimation = (toValue: number, duration: number = animations.fast) => {
    return Animated.timing(scaleAnim, {
      toValue,
      duration,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver: true,
    });
  };

  // Button press feedback
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: animations.fast,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animations.fast,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const stopAnimation = (animation: Animated.CompositeAnimation) => {
    animation.stop();
  };

  const resetRotateAnimation = () => {
    rotateAnim.setValue(0);
  };

  const resetAllAnimations = () => {
    slideAnim.setValue(0);
    rotateAnim.setValue(0);
    micPulseAnim.setValue(1);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  };

  // Style getters
  const getRotateStyle = () => ({
    transform: [{ 
      rotate: rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      })
    }]
  });

  const getSlideStyle = (fromValue: number, toValue: number) => ({
    transform: [{ 
      translateY: slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [fromValue, toValue],
      })
    }]
  });

  const getPulseStyle = () => ({
    transform: [{ 
      scale: micPulseAnim.interpolate({
        inputRange: [1, 1.2],
        outputRange: [1, 1.2],
        extrapolate: 'clamp',
      }) 
    }]
  });

  const getFadeStyle = () => ({
    opacity: fadeAnim
  });

  const getScaleStyle = () => ({
    transform: [{ 
      scale: scaleAnim.interpolate({
        inputRange: [0.95, 1],
        outputRange: [0.95, 1],
        extrapolate: 'clamp',
      }) 
    }]
  });

  return {
    slideAnim,
    rotateAnim,
    micPulseAnim,
    fadeAnim,
    scaleAnim,
    startSlideAnimation,
    startRotateAnimation,
    startPulseAnimation,
    startFadeAnimation,
    startScaleAnimation,
    animateButtonPress,
    stopAnimation,
    resetRotateAnimation,
    resetAllAnimations,
    getRotateStyle,
    getSlideStyle,
    getPulseStyle,
    getFadeStyle,
    getScaleStyle,
  };
}