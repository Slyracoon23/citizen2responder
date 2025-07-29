import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, Text, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Fade in first, then grow animation after delay
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CITIZEN2{'\n'}RESPONDER</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D93636',
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: height,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica-Bold' : 'sans-serif-black',
    lineHeight: 38,
  },
});