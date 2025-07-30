import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  TextInput, 
  Alert,
  Platform,
  Text
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';

interface Voice {
  identifier: string;
  name: string;
  language: string;
  quality: string;
}

type SpeechState = 'idle' | 'speaking' | 'paused';

export default function TextToSpeechScreen() {
  const router = useRouter();
  const [text, setText] = useState('Hello! This is a test of the text-to-speech functionality.');
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        const defaultVoice = availableVoices.find(voice => 
          voice.language.startsWith('en')
        ) || availableVoices[0];
        setSelectedVoice(defaultVoice.identifier);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      setSpeechState('speaking');
      
      Speech.speak(text, {
        voice: selectedVoice || undefined,
        rate: speechRate,
        pitch: speechPitch,
        onDone: () => setSpeechState('idle'),
        onStopped: () => setSpeechState('idle'),
        onError: () => setSpeechState('idle'),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setSpeechState('idle');
    }
  };

  const handleStop = async () => {
    try {
      await Speech.stop();
      setSpeechState('idle');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  const adjustRate = (delta: number) => {
    setSpeechRate(Math.max(0.1, Math.min(2.0, speechRate + delta)));
  };

  const adjustPitch = (delta: number) => {
    setSpeechPitch(Math.max(0.5, Math.min(2.0, speechPitch + delta)));
  };

  const getStatusColor = () => {
    return speechState === 'speaking' ? '#34C759' : '#8E8E93';
  };

  const getStatusText = () => {
    return speechState === 'speaking' ? 'Speaking...' : 'Ready';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text-to-Speech</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {/* Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text to Speak:</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Enter text to be spoken..."
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, speechState === 'speaking' ? styles.disabledButton : styles.primaryButton]}
              onPress={handleSpeak}
              disabled={speechState === 'speaking'}
            >
              <Text style={styles.buttonText}>▶️ Speak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, speechState === 'idle' ? styles.disabledButton : styles.stopButton]}
              onPress={handleStop}
              disabled={speechState === 'idle'}
            >
              <Text style={styles.buttonText}>⏹️ Stop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings:</Text>
          
          {/* Speed */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Speed: {speechRate.toFixed(1)}x</Text>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={() => adjustRate(-0.1)}>
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => adjustRate(0.1)}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pitch */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pitch: {speechPitch.toFixed(1)}</Text>
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={() => adjustPitch(-0.1)}>
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => adjustPitch(0.1)}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.infoText}>
            Available voices: {voices.length}{'\n'}
            Platform: {Platform.OS}
          </Text>
        </View>
      </ScrollView>
    </View>
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
    marginRight: 40,
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
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    height: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#4A7CB8',
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});