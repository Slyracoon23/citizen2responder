import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import deepgramService from '../services/deepgramService';
import { STT_CONFIG } from '../constants/sttConstants';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

interface UseSpeechToTextReturn {
  recordingState: RecordingState;
  isRecording: boolean;
  isProcessing: boolean;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  clearError: () => void;
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: STT_CONFIG.RECORDING.EXTENSION,
    outputFormat: Audio.AndroidOutputFormat.PCM_16BIT,
    audioEncoder: Audio.AndroidAudioEncoder.PCM_16BIT,
    sampleRate: STT_CONFIG.RECORDING.SAMPLE_RATE,
    numberOfChannels: STT_CONFIG.RECORDING.CHANNELS,
    bitRate: STT_CONFIG.RECORDING.BIT_RATE,
  },
  ios: {
    extension: STT_CONFIG.RECORDING.EXTENSION,
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: STT_CONFIG.RECORDING.SAMPLE_RATE,
    numberOfChannels: STT_CONFIG.RECORDING.CHANNELS,
    bitRate: STT_CONFIG.RECORDING.BIT_RATE,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: STT_CONFIG.RECORDING.BIT_RATE,
  },
};

export function useSpeechToText(): UseSpeechToTextReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (recordingState === 'error') {
      setRecordingState('idle');
    }
  }, [recordingState]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 STT: Starting recording...');
      
      // Clear any previous errors
      setErrorMessage(null);
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      
      setRecordingState('recording');
      
      // Haptic feedback to indicate recording started
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('🎤 STT: Recording started successfully');
      
    } catch (error) {
      console.error('🎤 STT: Error starting recording:', error);
      setRecordingState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start recording');
      
      // Cleanup on error
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('🎤 STT: Error cleaning up recording:', cleanupError);
        }
        recordingRef.current = null;
      }
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🎤 STT: Stopping recording...');
      
      if (!recordingRef.current) {
        console.warn('🎤 STT: No active recording to stop');
        return null;
      }

      setRecordingState('processing');
      
      // Stop recording and get the URI
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      console.log('🎤 STT: Recording saved to:', uri);

      // Check if file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Recording file is empty or does not exist');
      }

      console.log('🎤 STT: Recording file size:', fileInfo.size, 'bytes');

      // Haptic feedback to indicate processing started
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Send to Deepgram for transcription
      const transcript = await deepgramService.transcribeAudio(uri);

      // Clean up the temporary file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log('🎤 STT: Temporary audio file cleaned up');
      } catch (cleanupError) {
        console.warn('🎤 STT: Failed to clean up temporary file:', cleanupError);
      }

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setRecordingState('idle');
      console.log('🎤 STT: Transcription completed:', transcript);
      
      return transcript;

    } catch (error) {
      console.error('🎤 STT: Error stopping recording or transcribing:', error);
      
      // Error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setRecordingState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process recording');
      
      // Cleanup recording reference
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('🎤 STT: Error cleaning up recording after error:', cleanupError);
        }
        recordingRef.current = null;
      }
      
      return null;
    }
  }, []);

  return {
    recordingState,
    isRecording,
    isProcessing,
    errorMessage,
    startRecording,
    stopRecording,
    clearError,
  };
}