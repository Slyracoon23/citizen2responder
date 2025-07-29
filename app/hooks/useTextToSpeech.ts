import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import cartesiaService from '../services/cartesiaService';

type SpeechState = 'idle' | 'speaking';

export function useTextToSpeech() {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const audioRef = useRef<Audio.Sound | null>(null);

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        // Set audio mode for proper playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });

        const voices = cartesiaService.getAvailableVoices();
        console.log('TTS: Available Cartesia voices:', voices.length);
        setAvailableVoices(voices);
        
        // Select default voice
        if (voices.length > 0) {
          const defaultVoice = voices[0];
          setSelectedVoice(defaultVoice.id);
          console.log('TTS: Selected default voice:', defaultVoice.name);
        }
      } catch (error) {
        console.error('TTS: Error loading voices:', error);
      }
    };
    
    loadVoices();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      console.log('TTS: Stopping speech...');
      if (audioRef.current) {
        await audioRef.current.stopAsync();
        await audioRef.current.unloadAsync();
        audioRef.current = null;
      }
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
      
      console.log('TTS: Setting state to speaking');
      setSpeechState('speaking');

      // Generate audio using Cartesia API
      console.log('TTS: Generating audio with Cartesia API...');
      const audioDataUri = await cartesiaService.generateSpeechDataUri(
        text,
        selectedVoice || undefined,
        {
          speed: 'normal',
          language: 'en'
        }
      );

      console.log('TTS: Audio generated, loading for playback...');
      
      // Create and play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioDataUri },
        {
          shouldPlay: true,
          volume: 1.0,
        }
      );

      audioRef.current = sound;

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log('TTS: ✅ Speech completed successfully');
            setSpeechState('idle');
            sound.unloadAsync();
            audioRef.current = null;
          } else if (status.isPlaying) {
            console.log('TTS: ✅ Speech started successfully');
            setSpeechState('speaking');
          }
        }
      });

      console.log('TTS: Audio playback initiated successfully');
      
    } catch (error) {
      console.error('TTS: ❌ Error starting speech:', error);
      setSpeechState('idle');
      if (audioRef.current) {
        try {
          await audioRef.current.unloadAsync();
        } catch (unloadError) {
          console.error('TTS: Error unloading audio after error:', unloadError);
        }
        audioRef.current = null;
      }
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