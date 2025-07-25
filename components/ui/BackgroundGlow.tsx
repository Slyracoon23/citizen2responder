
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const GlowCircle = ({ color, size, initialPosition, durationRange }) => {
  const position = useRef(new Animated.ValueXY(initialPosition)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const animate = () => {
    const duration = Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0];
    Animated.parallel([
      Animated.timing(position, {
        toValue: {
          x: Math.random() * width - size / 2,
          y: Math.random() * height - size / 2,
        },
        duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => animate());
  };

  useEffect(() => {
    const animation = animate();
    // No cleanup function needed as the animation loop is self-sustaining
    // and tied to the component's lifecycle.
  }, []);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateX: position.x }, { translateY: position.y }, { scale }],
        },
      ]}
    />
  );
};

const BackgroundGlow = () => {
  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
        <GlowCircle
          color="#FF3B30" // Reddish
          size={300}
          initialPosition={{ x: width * 0.1, y: height * 0.2 }}
          durationRange={[10000, 15000]}
        />
        <GlowCircle
          color="#34C759" // Greenish
          size={250}
          initialPosition={{ x: width * 0.7, y: height * 0.1 }}
          durationRange={[12000, 18000]}
        />
        <GlowCircle
          color="#007AFF" // Blueish
          size={350}
          initialPosition={{ x: width * 0.3, y: height * 0.6 }}
          durationRange={[15000, 20000]}
        />
         <GlowCircle
          color="#FF9500" // Orange
          size={200}
          initialPosition={{ x: width * 0.8, y: height * 0.8 }}
          durationRange={[13000, 17000]}
        />
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1, // Ensure it's in the background
  },
  circle: {
    position: 'absolute',
    opacity: 0.4,
  },
});

export default BackgroundGlow;
