import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  TextInput, 
  Alert,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Voice {
  identifier: string;
  name: string;
  language: string;
  quality: string;
}

type SpeechState = 'idle' | 'speaking' | 'paused' | 'stopping';

export default function TextToSpeechTestScreen() {
  const router = useRouter();
  const [text, setText] = useState('Hello! This is a test of the text-to-speech functionality. You can type or paste any text here and I will speak it out loud.');
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Sample texts for quick testing
  const sampleTexts = [
    'Hello! This is a test of the text-to-speech functionality.',
    'Emergency alert: Please evacuate the building immediately.',
    'The weather today is sunny with a high of 75 degrees.',
    'Testing different punctuation! Question marks? Exclamation points! Commas, and periods.',
    'Numbers: 1, 2, 3, 4, 5. The time is 10:30 AM.',
  ];

  useEffect(() => {
    loadAvailableVoices();
  }, []);

  const loadAvailableVoices = async () => {
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        // Set default voice (prefer English voices)
        const defaultVoice = availableVoices.find(voice => 
          voice.language.startsWith('en')
        ) || availableVoices[0];
        setSelectedVoice(defaultVoice.identifier);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      setErrorMessage('Failed to load available voices');
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    if (text.length > Speech.maxSpeechInputLength) {
      Alert.alert('Error', `Text is too long. Maximum length is ${Speech.maxSpeechInputLength} characters.`);
      return;
    }

    try {
      setErrorMessage('');
      setSpeechState('speaking');

      const speechOptions = {
        voice: selectedVoice || undefined,
        rate: speechRate,
        pitch: speechPitch,
        ...(Platform.OS === 'ios' && { volume }),
        onStart: () => {
          console.log('Speech started');
          setSpeechState('speaking');
        },
        onDone: () => {
          console.log('Speech completed');
          setSpeechState('idle');
        },
        onStopped: () => {
          console.log('Speech stopped');
          setSpeechState('idle');
        },
        onError: (error: Error) => {
          console.error('Speech error:', error);
          setErrorMessage(`Speech error: ${error.message}`);
          setSpeechState('idle');
        },
      };

      Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Error starting speech:', error);
      setErrorMessage(`Failed to start speech: ${error}`);
      setSpeechState('idle');
    }
  };

  const handlePause = async () => {
    if (Platform.OS === 'android') {
      Alert.alert('Not Supported', 'Pause/Resume is not available on Android');
      return;
    }
    
    try {
      await Speech.pause();
      setSpeechState('paused');
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  };

  const handleResume = async () => {
    if (Platform.OS === 'android') {
      Alert.alert('Not Supported', 'Pause/Resume is not available on Android');
      return;
    }

    try {
      await Speech.resume();
      setSpeechState('speaking');
    } catch (error) {
      console.error('Error resuming speech:', error);
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

  const handleSampleText = (sampleText: string) => {
    setText(sampleText);
  };

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice.identifier);
    setShowVoicePicker(false);
  };

  const getSelectedVoiceName = () => {
    const voice = voices.find(v => v.identifier === selectedVoice);
    return voice ? `${voice.name} (${voice.language})` : 'Select a voice...';
  };

  const getStateColor = () => {
    switch (speechState) {
      case 'speaking': return '#34C759'; // Green
      case 'paused': return '#FF9500'; // Orange
      case 'stopping': return '#FF9500'; // Orange
      default: return '#8E8E93'; // Gray
    }
  };

  const getStateText = () => {
    switch (speechState) {
      case 'speaking': return 'Speaking...';
      case 'paused': return 'Paused';
      case 'stopping': return 'Stopping...';
      default: return 'Ready';
    }
  };

  const isIOS = Platform.OS === 'ios';

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
        <ThemedText style={styles.headerTitle}>Text-to-Speech Test</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: getStateColor() }]}>
            <ThemedText style={styles.statusText}>{getStateText()}</ThemedText>
          </View>
        </View>

        {/* Text Input Section */}
        <View style={styles.inputSection}>
          <ThemedText style={styles.sectionTitle}>Text to Speak:</ThemedText>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Enter text to be spoken..."
            multiline
            textAlignVertical="top"
            maxLength={Speech.maxSpeechInputLength}
          />
          <ThemedText style={styles.characterCount}>
            {text.length} / {Speech.maxSpeechInputLength} characters
          </ThemedText>
        </View>

        {/* Sample Texts */}
        <View style={styles.sampleSection}>
          <ThemedText style={styles.sectionTitle}>Sample Texts:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sampleTexts.map((sample, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sampleButton}
                onPress={() => handleSampleText(sample)}
              >
                <ThemedText style={styles.sampleButtonText}>
                  Sample {index + 1}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Speech Controls */}
        <View style={styles.controlsSection}>
          <ThemedText style={styles.sectionTitle}>Speech Controls:</ThemedText>
          
          <View style={styles.controlButtonsRow}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                speechState === 'speaking' ? styles.disabledButton : styles.primaryButton
              ]}
              onPress={handleSpeak}
              disabled={speechState === 'speaking'}
            >
              <ThemedText style={[styles.controlButtonText, styles.primaryButtonText]}>
                ▶️ Speak
              </ThemedText>
            </TouchableOpacity>

            {isIOS && (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  speechState !== 'speaking' ? styles.disabledButton : styles.secondaryButton
                ]}
                onPress={speechState === 'paused' ? handleResume : handlePause}
                disabled={speechState !== 'speaking' && speechState !== 'paused'}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  {speechState === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.controlButton,
                speechState === 'idle' ? styles.disabledButton : styles.stopButton
              ]}
              onPress={handleStop}
              disabled={speechState === 'idle'}
            >
              <ThemedText style={[styles.controlButtonText, styles.stopButtonText]}>
                ⏹️ Stop
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.settingsSection}>
          <ThemedText style={styles.sectionTitle}>Voice Settings:</ThemedText>
          
          {/* Voice Selection */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>Voice:</ThemedText>
            <TouchableOpacity 
              style={styles.customDropdown}
              onPress={() => setShowVoicePicker(true)}
            >
              <ThemedText style={styles.dropdownText} numberOfLines={1}>
                {getSelectedVoiceName()}
              </ThemedText>
              <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Speech Rate */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              Speed: {speechRate.toFixed(1)}x
            </ThemedText>
            <View style={styles.sliderContainer}>
              <TouchableOpacity onPress={() => setSpeechRate(Math.max(0.1, speechRate - 0.1))}>
                <ThemedText style={styles.sliderButton}>-</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.sliderValue}>{speechRate.toFixed(1)}</ThemedText>
              <TouchableOpacity onPress={() => setSpeechRate(Math.min(2.0, speechRate + 0.1))}>
                <ThemedText style={styles.sliderButton}>+</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Speech Pitch */}
          <View style={styles.settingRow}>
            <ThemedText style={styles.settingLabel}>
              Pitch: {speechPitch.toFixed(1)}
            </ThemedText>
            <View style={styles.sliderContainer}>
              <TouchableOpacity onPress={() => setSpeechPitch(Math.max(0.5, speechPitch - 0.1))}>
                <ThemedText style={styles.sliderButton}>-</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.sliderValue}>{speechPitch.toFixed(1)}</ThemedText>
              <TouchableOpacity onPress={() => setSpeechPitch(Math.min(2.0, speechPitch + 0.1))}>
                <ThemedText style={styles.sliderButton}>+</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Volume (iOS only) */}
          {isIOS && (
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>
                Volume: {Math.round(volume * 100)}%
              </ThemedText>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setVolume(Math.max(0.0, volume - 0.1))}>
                  <ThemedText style={styles.sliderButton}>-</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.sliderValue}>{Math.round(volume * 100)}%</ThemedText>
                <TouchableOpacity onPress={() => setVolume(Math.min(1.0, volume + 0.1))}>
                  <ThemedText style={styles.sliderButton}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Error Section */}
        {errorMessage && (
          <View style={styles.errorSection}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoTitle}>Features:</ThemedText>
          <ThemedText style={styles.infoText}>
            • Type or paste text to be spoken aloud{'\n'}
            • Choose from {voices.length} available voices{'\n'}
            • Adjust speech speed and pitch{'\n'}
            • Use sample texts for quick testing{'\n'}
            {isIOS ? '• Pause/Resume support (iOS only)' : '• Stop/Start controls (Android)'}
            {isIOS ? '\n• Volume control (iOS only)' : ''}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Custom Voice Picker Modal */}
      <Modal
        visible={showVoicePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Voice</ThemedText>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowVoicePicker(false)}
              >
                <ThemedText style={styles.modalCloseText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={voices}
              keyExtractor={(item) => item.identifier}
              style={styles.voiceList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.voiceItem,
                    selectedVoice === item.identifier && styles.selectedVoiceItem
                  ]}
                  onPress={() => handleVoiceSelect(item)}
                >
                  <View style={styles.voiceItemContent}>
                    <ThemedText style={[
                      styles.voiceName,
                      selectedVoice === item.identifier && styles.selectedVoiceText
                    ]}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={[
                      styles.voiceLanguage,
                      selectedVoice === item.identifier && styles.selectedVoiceSubtext
                    ]}>
                      {item.language} • {item.quality}
                    </ThemedText>
                  </View>
                  {selectedVoice === item.identifier && (
                    <ThemedText style={styles.checkmark}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  inputSection: {
    marginBottom: 30,
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
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  sampleSection: {
    marginBottom: 30,
  },
  sampleButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4A7CB8',
  },
  sampleButtonText: {
    color: '#4A7CB8',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsSection: {
    marginBottom: 30,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  controlButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#4A7CB8',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: 'white',
  },
  stopButtonText: {
    color: 'white',
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  customDropdown: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sliderButton: {
    backgroundColor: '#4A7CB8',
    color: 'white',
    width: 30,
    height: 30,
    textAlign: 'center',
    lineHeight: 30,
    borderRadius: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  voiceList: {
    maxHeight: 400,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedVoiceItem: {
    backgroundColor: '#E3F2FD',
  },
  voiceItemContent: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedVoiceText: {
    color: '#4A7CB8',
    fontWeight: '600',
  },
  voiceLanguage: {
    fontSize: 14,
    color: '#666',
  },
  selectedVoiceSubtext: {
    color: '#4A7CB8',
  },
  checkmark: {
    fontSize: 18,
    color: '#4A7CB8',
    fontWeight: 'bold',
    marginLeft: 12,
  },
});