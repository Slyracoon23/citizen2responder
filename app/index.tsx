import { useRouter } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();

  const handleStartNewReport = () => {
    router.push('/questionnaire');
  };

  const handleVideoCall = () => {
    router.push('/video-call' as any);
  };

  const handleLlamaTest = () => {
    router.push('/llama-test' as any);
  };

  const handleSpeechToTextTest = () => {
    router.push('/speech-to-text-test' as any);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Citizen2Responder</ThemedText>
        <ThemedText style={styles.languageText}>English</ThemedText>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Button Container */}
        <View style={styles.buttonContainer}>
          {/* Start New Report Button */}
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleStartNewReport}>
            <ThemedText style={[styles.buttonText, styles.primaryButtonText]}>
              START NEW REPORT
            </ThemedText>
          </TouchableOpacity>

          {/* View Saved Reports Button */}
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <ThemedText style={[styles.buttonText, styles.secondaryButtonText]}>
              VIEW SAVED REPORTS
            </ThemedText>
          </TouchableOpacity>

          {/* Video Call Button */}
          <TouchableOpacity style={[styles.button, styles.videoCallButton]} onPress={handleVideoCall}>
            <ThemedText style={[styles.buttonText, styles.videoCallButtonText]}>
              📹 START VIDEO CALL
            </ThemedText>
          </TouchableOpacity>

          {/* Llama Test Button */}
          <TouchableOpacity style={[styles.button, styles.llamaTestButton]} onPress={handleLlamaTest}>
            <ThemedText style={[styles.buttonText, styles.llamaTestButtonText]}>
              🤖 LLAMA TEST
            </ThemedText>
          </TouchableOpacity>

          {/* Speech-to-Text Test Button */}
          <TouchableOpacity style={[styles.button, styles.speechTestButton]} onPress={handleSpeechToTextTest}>
            <ThemedText style={[styles.buttonText, styles.speechTestButtonText]}>
              🎤 SPEECH-TO-TEXT TEST
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Emergency Call Button */}
        <TouchableOpacity style={[styles.button, styles.emergencyButton]}>
          <ThemedText style={[styles.buttonText, styles.emergencyButtonText]}>
            EMERGENCY CALL
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A7CB8', // Blue background color
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  languageText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    paddingLeft: 16,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 32,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: '15%',
    gap: 24,
    marginBottom: 40,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4A7CB8',
    paddingVertical: 32,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 22,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#4A7CB8',
    borderWidth: 2,
  },
  secondaryButtonText: {
    color: '#4A7CB8',
    fontSize: 18,
  },
  emergencyButton: {
    backgroundColor: '#D93636',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
  },
  videoCallButton: {
    backgroundColor: '#34C759',
  },
  videoCallButtonText: {
    color: 'white',
    fontSize: 18,
  },
  llamaTestButton: {
    backgroundColor: '#FF9500',
  },
  llamaTestButtonText: {
    color: 'white',
    fontSize: 18,
  },
  speechTestButton: {
    backgroundColor: '#9C27B0',
  },
  speechTestButtonText: {
    color: 'white',
    fontSize: 18,
  },
}); 