import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type RecognitionState = 'inactive' | 'starting' | 'recognizing' | 'stopping';

export default function SpeechToTextTestScreen() {
  const router = useRouter();
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('inactive');

  // Initialize permissions check on component mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setRecognizing(true);
    setRecognitionState('recognizing');
    setErrorMessage('');
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    setRecognizing(false);
    setRecognitionState('inactive');
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('Recognition result:', event.results);
    if (event.results && event.results.length > 0) {
      const result = event.results[0];
      if (event.isFinal) {
        setTranscript(prev => prev + result.transcript + ' ');
        setInterimTranscript('');
      } else {
        setInterimTranscript(result.transcript);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error, event.message);
    setErrorMessage(`Error: ${event.error} - ${event.message}`);
    setRecognizing(false);
    setRecognitionState('inactive');
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('speechstart', () => {
    console.log('Speech detected');
  });

  useSpeechRecognitionEvent('speechend', () => {
    console.log('Speech ended');
  });

  const checkPermissions = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('Permission status:', result);
      setPermissionStatus(`Status: ${result.status}, Granted: ${result.granted}`);
      return result.granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionStatus('Error checking permissions');
      return false;
    }
  };

  const checkAndRequestPermissions = async () => {
    try {
      // First check current permissions
      const currentResult = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('Current permission status:', currentResult);
      
      if (currentResult.granted) {
        setPermissionStatus(`Status: ${currentResult.status}, Granted: ${currentResult.granted}`);
        return true;
      }
      
      // If not granted, request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log('Permission request result:', result);
      setPermissionStatus(`Status: ${result.status}, Granted: ${result.granted}`);
      
      if (!result.granted) {
        Alert.alert(
          'Permissions Required',
          'Microphone and speech recognition permissions are required for this feature to work. Please grant permissions in your device settings if the dialog doesn\'t appear.',
          [{ text: 'OK' }]
        );
      }
      
      return result.granted;
    } catch (error) {
      console.error('Error with permissions:', error);
      setPermissionStatus(`Error: ${error}`);
      return false;
    }
  };


  const handleStart = async () => {
    setErrorMessage('');
    
    // Check if speech recognition is available
    const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!isAvailable) {
      setErrorMessage('Speech recognition is not available on this device');
      return;
    }

    // Request permissions
    const hasPermissions = await checkAndRequestPermissions();
    if (!hasPermissions) {
      return;
    }

    try {
      setRecognitionState('starting');
      
      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setErrorMessage(`Failed to start: ${error}`);
      setRecognitionState('inactive');
    }
  };

  const handleStop = () => {
    try {
      setRecognitionState('stopping');
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setErrorMessage(`Failed to stop: ${error}`);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage('');
  };

  const getStateColor = () => {
    switch (recognitionState) {
      case 'recognizing': return '#34C759'; // Green
      case 'starting': return '#FF9500'; // Orange
      case 'stopping': return '#FF9500'; // Orange
      default: return '#8E8E93'; // Gray
    }
  };

  const getStateText = () => {
    switch (recognitionState) {
      case 'recognizing': return 'Listening...';
      case 'starting': return 'Starting...';
      case 'stopping': return 'Stopping...';
      default: return 'Ready';
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Speech-to-Text Test</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: getStateColor() }]}>
            <ThemedText style={styles.statusText}>{getStateText()}</ThemedText>
          </View>
          
          {permissionStatus !== 'unknown' && (
            <ThemedText style={styles.permissionText}>{permissionStatus}</ThemedText>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              recognizing ? styles.stopButton : styles.startButton,
              recognitionState !== 'inactive' && recognitionState !== 'recognizing' ? styles.disabledButton : null
            ]}
            onPress={recognizing ? handleStop : handleStart}
            disabled={recognitionState === 'starting' || recognitionState === 'stopping'}
          >
            <ThemedText style={[
              styles.controlButtonText,
              recognizing ? styles.stopButtonText : styles.startButtonText
            ]}>
              {recognizing ? '🛑 Stop Recording' : '🎤 Start Recording'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={checkAndRequestPermissions}
          >
            <ThemedText style={styles.secondaryButtonText}>
              🔒 Request Permissions
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={handleClear}
          >
            <ThemedText style={styles.secondaryButtonText}>
              🗑️ Clear Text
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Transcript Section */}
        <View style={styles.transcriptSection}>
          <ThemedText style={styles.sectionTitle}>Live Transcript:</ThemedText>
          
          <ScrollView style={styles.transcriptContainer} nestedScrollEnabled>
            <ThemedText style={styles.finalTranscript}>
              {transcript}
            </ThemedText>
            {interimTranscript && (
              <ThemedText style={styles.interimTranscript}>
                {interimTranscript}
              </ThemedText>
            )}
            {!transcript && !interimTranscript && (
              <ThemedText style={styles.placeholderText}>
                Transcript will appear here when you start speaking...
              </ThemedText>
            )}
          </ScrollView>
        </View>

        {/* Error Section */}
        {errorMessage && (
          <View style={styles.errorSection}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoTitle}>How to use:</ThemedText>
          <ThemedText style={styles.infoText}>
            1. Tap "Start Recording" to begin speech recognition{'\n'}
            2. Speak clearly into your device's microphone{'\n'}
            3. Watch the live transcript appear in real-time{'\n'}
            4. Tap "Stop Recording" when finished{'\n'}
            5. Use "Clear Text" to reset the transcript
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#4A7CB8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginRight: 40, // Compensate for back button
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controlsSection: {
    gap: 15,
    marginBottom: 30,
  },
  controlButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4A7CB8',
  },
  disabledButton: {
    opacity: 0.6,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonText: {
    color: 'white',
  },
  stopButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#4A7CB8',
  },
  transcriptSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  transcriptContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  finalTranscript: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  interimTranscript: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    fontStyle: 'italic',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 40,
  },
  errorSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});