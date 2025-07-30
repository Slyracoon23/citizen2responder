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

        const allVoices = await Speech.getAvailableVoicesAsync();
        const englishVoices = allVoices.filter(v => v.language.startsWith('en'));
        console.log('TTS: Available Expo voices:', allVoices.length);
        console.log('TTS: Available English voices:', englishVoices.length);
        setAvailableVoices(englishVoices);
        
        // Select a good voice from English voices
        if (englishVoices.length > 0) {
          // Prefer an enhanced quality English voice
          const enhancedVoice = englishVoices.find(
            (v) => v.quality === Speech.VoiceQuality.Enhanced
          );

          // If no enhanced voice, find any English voice
          const defaultVoice = englishVoices.find((v) => v.language.startsWith('en'));

          // Prefer "Tessa" voice if available
          const tessaVoice = englishVoices.find((v) => v.name === 'Tessa');

          // Use Tessa if available, otherwise enhanced, otherwise default, otherwise the first English voice
          const selected = tessaVoice || enhancedVoice || defaultVoice || englishVoices[0];

          if (selected) {
            setSelectedVoice(selected.identifier);
            console.log(`TTS: Selected voice: ${selected.name} (Quality: ${selected.quality}, Language: ${selected.language})`);
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
        rate: 1.1, // Slightly faster speech rate (default is 1.0)
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