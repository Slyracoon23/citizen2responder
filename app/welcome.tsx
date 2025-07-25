import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Alert,
  SafeAreaView
} from 'react-native';
import { Image } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleStart = () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please acknowledge the risks to continue.');
      return;
    }
    router.push('/');
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.emergencyButton} onPress={handle911Call}>
          <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-with-text.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.disclaimerText}>
          This app provides guidance only.{'\n'}
          Use at your own risk.
        </Text>

        <Text style={styles.emergencyNotice}>
          If you are having a true life threatening emergency,{'\n'}
          you should call 911 immediately.
        </Text>

        <View style={styles.actions}>
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

          <TouchableOpacity 
            style={[styles.startButton, !termsAccepted && styles.startButtonDisabled]} 
            onPress={handleStart}
            disabled={!termsAccepted}
          >
            <Text style={[styles.startButtonText, !termsAccepted && styles.startButtonTextDisabled]}>
              GET STARTED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F1F1',
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  emergencyButton: {
    backgroundColor: '#D93636',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 280,
    height: 140,
  },
  disclaimerText: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emergencyNotice: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
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
    borderColor: '#333',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  checkmark: {
    color: '#F2F1F1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#333',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#D93636',
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
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
});