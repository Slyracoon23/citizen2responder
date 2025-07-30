import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleStart = () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please acknowledge the risks to continue.');
      return;
    }
    router.push('/video-call');
  };

  const handle911Call = () => {
    Alert.alert(
      'Emergency Call',
      'Are you sure you want to call 911?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 911', 
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('tel:911');
            } else {
              Linking.openURL('tel:911');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Background Hero Image */}
        <Image 
          source={require('@/assets/images/citizen2responder-hero-image.jpg')} 
          style={styles.heroBackground}
        />
        
        {/* Overlay Content */}
        <View style={styles.overlay}>
          <View style={styles.topSection}>
            <Image 
              source={require('@/assets/images/logo-transparent-with-white-text-and-full-icon.png')} 
              style={styles.logo}
            />
          </View>
          <View style={styles.bottomSection}>
            {/* Title and Description */}
            <View style={{marginBottom: 10}}>
              <Text style={styles.title}>
                Help responders
              </Text>
              <Text style={[styles.title, styles.titleRed]}>
                Help you
              </Text>
            </View>

            <Text style={styles.description}>
              AI-powered emergency response guidance{'\n'}
              to help you in critical situations
            </Text>
            {/* Terms checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I acknowledge and accept the risks involved
              </Text>
            </TouchableOpacity>

            {/* Get Started Button */}
            <TouchableOpacity 
              style={[styles.startButton, !termsAccepted && styles.startButtonDisabled]} 
              onPress={handleStart}
              disabled={!termsAccepted}
            >
              <Text style={[styles.startButtonText, !termsAccepted && styles.startButtonTextDisabled]}>
                Report Emergency
              </Text>
            </TouchableOpacity>

            {/* Text-to-Speech Test Button */}
            {/* <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => router.push('/text-to-speech')}
            >
              <Text style={styles.testButtonText}>
                🔊 Test Text-to-Speech
              </Text>
            </TouchableOpacity> */}

            <Text style={[styles.disclaimerText, { textAlign: 'center' }]}>
              If you are having a true life threatening emergency,{'\n'}
              you should call 911 immediately.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    alignSelf: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    marginBottom: 20,
  },
  startButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startButtonTextDisabled: {
    color: '#F2F1F1',
  },
  disclaimerText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    paddingRight: 20,
  },
  logo: {
    width: 340,
    height: 140,
    resizeMode: 'contain',
  },
  titleRed: {
    color: '#DC2626',
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});