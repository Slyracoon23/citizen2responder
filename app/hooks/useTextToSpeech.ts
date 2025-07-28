import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

type SpeechState = 'idle' | 'speaking';

export function useTextToSpeech() {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        console.log('TTS: Available voices:', voices.length);
        setAvailableVoices(voices);
        
        // Select default voice (prefer English voices)
        if (voices.length > 0) {
          const defaultVoice = voices.find(voice => 
            voice.language.startsWith('en')
          ) || voices[0];
          setSelectedVoice(defaultVoice.identifier);
          console.log('TTS: Selected default voice:', defaultVoice.name, defaultVoice.language);
        }
      } catch (error) {
        console.error('TTS: Error loading voices:', error);
      }
    };
    
    loadVoices();
  }, []);

  const stop = useCallback(async () => {
    try {
      console.log('TTS: Stopping speech...');
      await Speech.stop();
      setSpeechState('idle');
      console.log('TTS: Speech stopped successfully');
    } catch (error) {
      console.error('TTS: Error stopping speech:', error);
      setSpeechState('idle');
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      console.log('TTS: Empty text provided, skipping speech');
      return;
    }

    try {
      console.log('TTS: Starting speech for text:', text.substring(0, 50) + '...');
      
      // Stop any existing speech first
      await stop();
      
      // Small delay to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check text length limit
      if (text.length > Speech.maxSpeechInputLength) {
        console.warn('TTS: Text too long for speech, truncating...', text.length, 'chars');
        text = text.substring(0, Speech.maxSpeechInputLength);
      }

      console.log('TTS: Setting state to speaking');
      setSpeechState('speaking');

      const speechOptions = {
        voice: selectedVoice || undefined,
        rate: 1.0,
        pitch: 1.0,
        // Force volume to 1.0 on iOS to override silent mode
        ...(Platform.OS === 'ios' && { volume: 1.0 }),
        onStart: () => {
          console.log('TTS: ✅ Speech started successfully');
          setSpeechState('speaking');
        },
        onDone: () => {
          console.log('TTS: ✅ Speech completed successfully');
          setSpeechState('idle');
        },
        onStopped: () => {
          console.log('TTS: ⏹️ Speech stopped');
          setSpeechState('idle');
        },
        onError: (error: Error) => {
          console.error('TTS: ❌ Speech error:', error);
          setSpeechState('idle');
        },
      };

      console.log('TTS: Initiating Speech.speak with options:', {
        voice: speechOptions.voice,
        rate: speechOptions.rate,
        pitch: speechOptions.pitch,
        volume: speechOptions.volume,
        textLength: text.length
      });

      Speech.speak(text, speechOptions);
      
      console.log('TTS: Speech.speak called successfully');
    } catch (error) {
      console.error('TTS: ❌ Error starting speech:', error);
      setSpeechState('idle');
    }
  }, [stop, selectedVoice]);

  const isSpeaking = speechState === 'speaking';

  return {
    speak,
    stop,
    isSpeaking,
    speechState,
    availableVoices,
    selectedVoice,
  };
}