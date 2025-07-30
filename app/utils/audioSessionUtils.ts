import { Audio } from 'expo-av';

/**
 * Audio session management utilities for iOS audio volume fix
 * 
 * The root cause of the volume issue:
 * - When allowsRecordingIOS: true is set, iOS switches to AVAudioSessionCategoryPlayAndRecord
 * - This category reduces volume to prevent feedback loops during recording
 * - The setting persists globally until explicitly reset
 * 
 * Solution:
 * - Always reset to playback-optimized settings when recording is not needed
 * - Configure optimal playback settings before text-to-speech
 */

/**
 * Configure audio session for recording (speech-to-text)
 * This reduces volume to prevent feedback but enables microphone input
 */
export async function setRecordingMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    console.log('🔊 Audio Session: Set to recording mode');
  } catch (error) {
    console.error('🔊 Audio Session: Failed to set recording mode:', error);
    throw error;
  }
}

/**
 * Configure audio session for optimal playback (text-to-speech)
 * This maximizes volume for media playback and disables recording
 */
export async function setPlaybackMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('🔊 Audio Session: Set to playback mode (max volume)');
  } catch (error) {
    console.error('🔊 Audio Session: Failed to set playback mode:', error);
    throw error;
  }
}

/**
 * Reset audio session to default playback settings
 * Call this when leaving recording contexts or cleaning up
 */
export async function resetToDefaultPlayback(): Promise<void> {
  try {
    await setPlaybackMode();
    console.log('🔊 Audio Session: Reset to default playback settings');
  } catch (error) {
    console.error('🔊 Audio Session: Failed to reset to default:', error);
    // Don't throw here as this is cleanup - just log the error
  }
}

/**
 * Configure audio session specifically for text-to-speech with maximum volume
 * This ensures TTS always plays at full volume regardless of previous recording state
 */
export async function configureForTextToSpeech(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false, // Critical: ensures maximum volume
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('🔊 Audio Session: Configured for text-to-speech (max volume)');
  } catch (error) {
    console.error('🔊 Audio Session: Failed to configure for TTS:', error);
    throw error;
  }
}