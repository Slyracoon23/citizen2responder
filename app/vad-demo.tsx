import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useVoiceActivityDetection } from '@/hooks/useVoiceActivityDetection';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function VADDemoScreen() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);

  const {
    isVoiceActive,
    isListening,
    isStarting,
    startVAD,
    stopVAD,
    permissionStatus,
    error,
    clearError,
  } = useVoiceActivityDetection({
    silenceTimeout: 1000, // 1 second timeout for responsive demo
    debug: __DEV__, // Enable debug logging in development
  });

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopVAD();
      }
    };
  }, [isListening, stopVAD]);

  const handleStart = async () => {
    const success = await startVAD();
    if (success) {
      setIsStarted(true);
    } else {
      Alert.alert(
        'Failed to Start',
        'Could not start voice activity detection. Please check permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStop = () => {
    stopVAD();
    setIsStarted(false);
  };

  const getStatusColor = () => {
    if (isStarting) return '#007AFF'; // Blue - starting
    if (!isListening) return '#8E8E93'; // Gray - not listening
    if (isVoiceActive) return '#34C759'; // Green - voice detected
    return '#FF9500'; // Orange - listening but no voice
  };

  const getStatusText = () => {
    if (isStarting) return 'Starting...';
    if (!isListening) return 'Not Listening';
    if (isVoiceActive) return 'Voice Detected!';
    return 'Listening...';
  };

  const getVADIndicatorSize = () => {
    if (isStarting) return 110; // Medium when starting
    if (!isListening) return 100;
    if (isVoiceActive) return 140; // Larger when voice is active
    return 120; // Medium when listening
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
        <ThemedText style={styles.headerTitle}>Voice Activity Detection</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main VAD Visual Indicator */}
        <View style={styles.vadSection}>
          <View
            style={[
              styles.vadIndicator,
              {
                backgroundColor: getStatusColor(),
                width: getVADIndicatorSize(),
                height: getVADIndicatorSize(),
                borderRadius: getVADIndicatorSize() / 2,
              }
            ]}
          >
            <ThemedText style={styles.vadText}>
              {isStarting ? '⏳' : isVoiceActive ? '🎤' : isListening ? '👂' : '🔇'}
            </ThemedText>
          </View>

          <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </ThemedText>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isStarted ? styles.stopButton : styles.startButton,
              isStarting ? styles.disabledButton : null,
            ]}
            onPress={isStarted ? handleStop : handleStart}
            disabled={isStarting}
          >
            <ThemedText style={[
              styles.controlButtonText,
              isStarted ? styles.stopButtonText : styles.startButtonText
            ]}>
              {isStarting ? '⏳ Starting...' : isStarted ? '🛑 Stop VAD' : '🎯 Start VAD'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Status Information */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoTitle}>Status Information</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Listening:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: isListening ? '#34C759' : '#FF3B30' }]}>
              {isListening ? 'Yes' : 'No'}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Voice Active:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: isVoiceActive ? '#34C759' : '#8E8E93' }]}>
              {isVoiceActive ? 'Yes' : 'No'}
            </ThemedText>
          </View>

          {permissionStatus !== 'unknown' && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Permissions:</ThemedText>
              <ThemedText style={styles.infoValue}>{permissionStatus}</ThemedText>
            </View>
          )}
        </View>

        {/* Error Section */}
        {error && (
          <View style={styles.errorSection}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity
              style={styles.clearErrorButton}
              onPress={clearError}
            >
              <ThemedText style={styles.clearErrorText}>Dismiss</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <ThemedText style={styles.instructionsTitle}>How it works:</ThemedText>
          <ThemedText style={styles.instructionsText}>
            1. Tap "Start VAD" to begin voice activity detection{'\n'}
            2. The circle turns orange when listening{'\n'}
            3. The circle turns green and grows when you speak{'\n'}
            4. Voice activity detection happens in real-time{'\n'}
            5. No transcription is stored - just voice detection
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
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  vadSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 40,
  },
  vadIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  vadText: {
    fontSize: 48,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsSection: {
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
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  clearErrorButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F44336',
    borderRadius: 6,
  },
  clearErrorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  instructionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});
