import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent
} from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

type RecognitionState = 'inactive' | 'starting' | 'recognizing' | 'stopping';

export function useSpeechToText() {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>('inactive');

  // Permissions check on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Event handlers
  useSpeechRecognitionEvent('start', () => {
    setRecognizing(true);
    setRecognitionState('recognizing');
    setErrorMessage('');
  });

  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    setRecognitionState('inactive');
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    console.log('🔍 SPEECH DEBUG: Result event received');
    console.log('🔍 SPEECH DEBUG: event.results:', event.results);
    console.log('🔍 SPEECH DEBUG: event.isFinal:', event.isFinal);
    
    if (event.results && event.results.length > 0) {
      const result = event.results[0];
      console.log('🔍 SPEECH DEBUG: result.transcript:', result.transcript);
      
      if (event.isFinal) {
        console.log('🔍 SPEECH DEBUG: Setting FINAL transcript to:', result.transcript);
        console.log('🔍 SPEECH DEBUG: Previous transcript was:', transcript);
        // Replace transcript instead of concatenating to prevent accumulation
        setTranscript(result.transcript);
        setInterimTranscript('');
      } else {
        console.log('🔍 SPEECH DEBUG: Setting INTERIM transcript to:', result.transcript);
        setInterimTranscript(result.transcript);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setErrorMessage(`Error: ${event.error} - ${event.message}`);
    setRecognizing(false);
    setRecognitionState('inactive');
    setInterimTranscript('');
  });

  // Optionally handle speechstart/speechend if needed

  const checkPermissions = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      setPermissionStatus(`Status: ${result.status}, Granted: ${result.granted}`);
      return result.granted;
    } catch (error) {
      setPermissionStatus('Error checking permissions');
      return false;
    }
  };

  const checkAndRequestPermissions = async () => {
    try {
      const currentResult = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (currentResult.granted) {
        setPermissionStatus(`Status: ${currentResult.status}, Granted: ${currentResult.granted}`);
        return true;
      }
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
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
      setPermissionStatus(`Error: ${error}`);
      return false;
    }
  };

  const start = async () => {
    setErrorMessage('');
    const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!isAvailable) {
      setErrorMessage('Speech recognition is not available on this device');
      return;
    }
    const hasPermissions = await checkAndRequestPermissions();
    if (!hasPermissions) {
      return;
    }
    try {
      setRecognitionState('starting');
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      setErrorMessage(`Failed to start: ${error}`);
      setRecognitionState('inactive');
    }
  };

  const stop = () => {
    try {
      setRecognitionState('stopping');
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      setErrorMessage(`Failed to stop: ${error}`);
    }
  };

  const clear = () => {
    console.log('🔍 SPEECH DEBUG: clear() called');
    console.log('🔍 SPEECH DEBUG: Clearing transcript from:', transcript);
    console.log('🔍 SPEECH DEBUG: Clearing interimTranscript from:', interimTranscript);
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage('');
    console.log('🔍 SPEECH DEBUG: Transcripts cleared');
  };

  return {
    transcript,
    interimTranscript,
    errorMessage,
    recognizing,
    recognitionState,
    permissionStatus,
    start,
    stop,
    clear,
    checkPermissions,
    checkAndRequestPermissions,
  };
} 