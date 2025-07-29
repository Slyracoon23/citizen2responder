import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>citizen2responder</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>

          {/* Title and Description */}
          <Text style={styles.title}>
            citizen2responder
          </Text>

          <Text style={styles.description}>
            AI-powered emergency response guidance{'\n'}
            to help you in critical situations
          </Text>
        </View>

        <View style={styles.bottomSection}>
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

          <Text style={[styles.disclaimerText, { textAlign: 'center' }]}>
            If you are having a true life threatening emergency,{'\n'}
            you should call 911 immediately.
          </Text>
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
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
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
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
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
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});