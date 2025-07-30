import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { configureForTextToSpeech } from '../utils/audioSessionUtils';

type SpeechState = 'idle' | 'speaking';

export function useTextToSpeech() {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        // Set audio mode for proper playback
        await configureForTextToSpeech();

        const voices = await Speech.getAvailableVoicesAsync();
        console.log('TTS: Available Expo voices:', voices.length);
        setAvailableVoices(voices);
        
        // Select default English voice
        if (voices.length > 0) {
          const defaultVoice = voices.find(voice => voice.language.startsWith('en')) || voices[0];
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.identifier);
            console.log('TTS: Selected default voice:', defaultVoice.name);
          }
        }
      } catch (error) {
        console.error('TTS: Error loading voices:', error);
      }
    };
    
    loadVoices();
  }, []);

  // Cleanup: stop speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      console.log('TTS: Stopping speech...');
      await Speech.stop();
      // The onStopped callback will set the state to idle.
      console.log('TTS: Speech stop requested');
    } catch (error) {
      console.error('TTS: Error stopping speech:', error);
      setSpeechState('idle'); // Force idle state on error
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      console.log('TTS: Empty text provided, skipping speech');
      return;
    }

    try {
      console.log('TTS: Starting speech for text:', text.substring(0, 50) + '...');
      
      // Stop any existing speech first. This is important for re-speaking.
      await Speech.stop();
      
      // Configure audio session for optimal playback before speaking
      await configureForTextToSpeech();
      
      setSpeechState('speaking');

      Speech.speak(text, {
        voice: selectedVoice || undefined,
        onStart: () => {
          console.log('TTS: ✅ Speech started successfully');
        },
        onDone: () => {
          console.log('TTS: ✅ Speech completed successfully');
          setSpeechState('idle');
        },
        onStopped: () => {
          console.log('TTS: Speech stopped');
          setSpeechState('idle');
        },
        onError: (error) => {
          console.error('TTS: ❌ Error during speech:', error);
          setSpeechState('idle');
        },
      });
      
    } catch (error) {
      console.error('TTS: ❌ Error starting speech:', error);
      setSpeechState('idle');
    }
  }, [selectedVoice]);

  const isSpeaking = speechState === 'speaking';

  return {
    speak,
    stop,
    isSpeaking,
    speechState,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
  };
}