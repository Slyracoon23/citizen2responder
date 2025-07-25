import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

/**
 * Configuration options for voice activity detection
 */
interface UseVoiceActivityDetectionOptions {
  /** Language for speech recognition (default: 'en-US') */
  lang?: string;
  /** Time in ms to wait before considering voice inactive (default: 1500) */
  silenceTimeout?: number;
  /** Enable continuous recognition (default: true) */
  continuous?: boolean;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Return type for useVoiceActivityDetection hook
 */
interface UseVoiceActivityDetectionReturn {
  /** Whether voice activity is currently detected */
  isVoiceActive: boolean;
  /** Whether the VAD is currently listening */
  isListening: boolean;
  /** Whether the VAD is in the process of starting */
  isStarting: boolean;
  /** Start voice activity detection */
  startVAD: () => Promise<boolean>;
  /** Stop voice activity detection */
  stopVAD: () => void;
  /** Current permission status */
  permissionStatus: string;
  /** Current error message, if any */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * React hook for real-time voice activity detection using speech recognition
 * 
 * Uses interim speech recognition results to detect voice activity in real-time.
 * Voice activity is determined by the presence of speech transcription results,
 * with a configurable silence timeout to smooth transitions.
 * 
 * @param options - Configuration options for voice activity detection
 * @returns Object containing voice activity state and control functions
 * 
 * @example
 * ```tsx
 * const { isVoiceActive, isListening, startVAD, stopVAD } = useVoiceActivityDetection({
 *   silenceTimeout: 1000,
 *   debug: true
 * });
 * 
 * // Start detection
 * const success = await startVAD();
 * 
 * // Voice activity state updates automatically
 * console.log('Voice detected:', isVoiceActive);
 * ```
 */
export function useVoiceActivityDetection(
  options: UseVoiceActivityDetectionOptions = {}
): UseVoiceActivityDetectionReturn {
  const { continuous = true, lang = 'en-US', silenceTimeout = 1500, debug = false } = options;
  
  // Debug logging helper
  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`VAD: ${message}`, ...args);
    }
  }, [debug]);
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing silence timeout
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResultTimeRef = useRef<number>(0);

  // Memoize speech recognition configuration
  const speechConfig = useMemo(() => ({
    lang,
    interimResults: true, // Enable interim results for real-time detection
    continuous,
    maxAlternatives: 1,
    requiresOnDeviceRecognition: false,
    addsPunctuation: false,
  }), [lang, continuous]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        log('Cleaned up silence timer on unmount');
      }
    };
  }, [log]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    log('Speech recognition started');
    setIsStarting(false);
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    log('Speech recognition ended');
    clearSilenceTimer();
    setIsStarting(false);
    setIsListening(false);
    setIsVoiceActive(false);
  });

  // Helper function to clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      log('Cleared silence timer');
    }
  }, [log]);

  // Helper function to start silence timer
  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    log(`Starting silence timer (${silenceTimeout}ms)`);
    silenceTimerRef.current = setTimeout(() => {
      log('Silence timeout reached - Voice activity ended');
      setIsVoiceActive(false);
      silenceTimerRef.current = null;
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer, log]);

  useSpeechRecognitionEvent('error', (event) => {
    console.error('VAD Error:', event.error, event.message); // Always log errors
    log('Full error object:', JSON.stringify(event, null, 2));
    clearSilenceTimer();
    setError(`${event.error}: ${event.message}`);
    setIsStarting(false);
    setIsListening(false);
    setIsVoiceActive(false);
  });

  // Use result events for real-time voice activity detection
  const handleResult = useCallback((event: any) => {
    const now = Date.now();
    lastResultTimeRef.current = now;
    
    log('Result event received - VOICE DETECTED!');
    log('Results:', event.results);
    log('isFinal:', event.isFinal);
    
    // Any result (interim or final) indicates voice activity
    if (event.results && event.results.length > 0) {
      const hasTranscript = event.results.some((result: any) => 
        result.transcript && result.transcript.trim().length > 0
      );
      
      if (hasTranscript) {
        log('Voice activity detected via result event!');
        setIsVoiceActive(prev => {
          if (!prev) {
            log('Setting isVoiceActive to TRUE');
            return true;
          }
          return prev;
        });
        
        // Reset the silence timer since we got new voice input
        startSilenceTimer();
      }
    }
  }, [log, startSilenceTimer]);

  useSpeechRecognitionEvent('result', handleResult);

  // Optional debug event listeners
  if (debug) {
    useSpeechRecognitionEvent('audiostart', () => {
      log('Audio capture started');
    });

    useSpeechRecognitionEvent('audioend', () => {
      log('Audio capture ended');
    });
  }

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      log('Checking permissions...');
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      log('Permission result:', JSON.stringify(result, null, 2));
      setPermissionStatus(`Status: ${result.status}, Granted: ${result.granted}`);
      return result.granted;
    } catch (error) {
      console.error('VAD: Error checking permissions:', error);
      setPermissionStatus('Error checking permissions');
      return false;
    }
  }, [log]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      log('Requesting permissions...');
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      log('Permission request result:', JSON.stringify(result, null, 2));
      setPermissionStatus(`Status: ${result.status}, Granted: ${result.granted}`);
      return result.granted;
    } catch (error) {
      console.error('VAD: Error requesting permissions:', error);
      setPermissionStatus(`Error: ${error}`);
      return false;
    }
  }, [log]);

  const startVAD = useCallback(async (): Promise<boolean> => {
    if (isStarting || isListening) {
      log('VAD already starting or listening, ignoring request');
      return true;
    }

    log('Starting VAD...');
    setIsStarting(true);
    setError(null);
    
    try {
      // Check if speech recognition is available
      const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      log('Speech recognition available:', isAvailable);
      if (!isAvailable) {
        setError('Speech recognition is not available on this device');
        setIsStarting(false);
        return false;
      }

      // Check permissions first
      let hasPermissions = await checkPermissions();
      if (!hasPermissions) {
        hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          setError('Microphone permissions are required for voice activity detection');
          setIsStarting(false);
          return false;
        }
      }

      log('Starting speech recognition with config:', JSON.stringify(speechConfig, null, 2));
      
      ExpoSpeechRecognitionModule.start(speechConfig);
      
      log('Speech recognition started successfully');
      return true;
    } catch (error) {
      console.error('VAD: Error starting voice activity detection:', error);
      setError(`Failed to start VAD: ${error}`);
      setIsStarting(false);
      return false;
    }
  }, [isStarting, isListening, speechConfig, checkPermissions, requestPermissions, log]);

  const stopVAD = useCallback(() => {
    try {
      log('Stopping VAD...');
      ExpoSpeechRecognitionModule.stop();
      log('VAD stopped successfully');
    } catch (error) {
      console.error('VAD: Error stopping voice activity detection:', error);
      setError(`Failed to stop VAD: ${error}`);
    }
  }, [log]);

  return {
    isVoiceActive,
    isListening,
    isStarting,
    startVAD,
    stopVAD,
    permissionStatus,
    error,
    clearError,
  };
}