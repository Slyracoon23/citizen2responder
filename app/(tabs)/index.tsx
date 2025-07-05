import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Header Section */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Citizen2Responder</ThemedText>
          <ThemedText style={styles.languageText}>English</ThemedText>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Start New Report Button */}
        <TouchableOpacity style={styles.primaryButton}>
          <ThemedText style={styles.primaryButtonText}>
            START{'\n'}NEW REPORT s
          </ThemedText>
        </TouchableOpacity>

        {/* View Saved Reports Button */}
        <TouchableOpacity style={styles.secondaryButton}>
          <ThemedText style={styles.secondaryButtonText}>
            VIEW SAVED REPORTS
          </ThemedText>
        </TouchableOpacity>

        {/* Emergency Call Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <ThemedText style={styles.emergencyButtonText}>
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
  safeArea: {
    backgroundColor: '#4A7CB8',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  languageText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#4A7CB8',
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#4A7CB8',
    borderWidth: 3,
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#4A7CB8',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 25,
    paddingVertical: 25,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
