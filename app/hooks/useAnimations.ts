import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
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

  const startSlideAnimation = (toValue: number) => {
    createSlideAnimation(slideAnim, toValue).start();
  };

  const startRotateAnimation = () => {
    const animation = createRotateAnimation(rotateAnim);
    animation.start();
    return animation;
  };

  const startPulseAnimation = () => {
    const animation = createPulseAnimation(micPulseAnim);
    animation.start();
    return animation;
  };

  const stopAnimation = (animation: Animated.CompositeAnimation) => {
    animation.stop();
  };

  const resetRotateAnimation = () => {
    rotateAnim.setValue(0);
  };

  const getRotateStyle = () => ({
    transform: [{ rotate: getRotateInterpolation(rotateAnim) }]
  });

  const getSlideStyle = (fromValue: number, toValue: number) => ({
    transform: [{ translateY: getSlideInterpolation(slideAnim, fromValue, toValue) }]
  });

  const getPulseStyle = () => ({
    transform: [{ scale: micPulseAnim }]
  });

  return {
    slideAnim,
    rotateAnim,
    micPulseAnim,
    startSlideAnimation,
    startRotateAnimation,
    startPulseAnimation,
    stopAnimation,
    resetRotateAnimation,
    getRotateStyle,
    getSlideStyle,
    getPulseStyle,
  };
}