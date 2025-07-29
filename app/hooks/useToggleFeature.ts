import { useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { handleToggleFeature } from '../services/permissionUtils';

export function useToggleFeature() {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [isQuestionToggleOn, setIsQuestionToggleOn] = useState(false);
  const [isImageInputEnabled, setIsImageInputEnabled] = useState(false);
  const [isGenerateReportOn, setIsGenerateReportOn] = useState(false);
  const [isPreCareToggleOn, setIsPreCareToggleOn] = useState(false);

  const handleCameraToggle = async (
    hasPermission: boolean | null,
    requestPermission: () => Promise<boolean>
  ) => {
    await handleToggleFeature({
      isOn: isCameraOn,
      setIsOn: setIsCameraOn,
      hasPermission,
      requestPermission,
      alertTitle: 'Camera Permission Required',
      alertMessage: 'Please enable camera access in your device settings to use this feature.',
    });
  };

  const handleVoiceToggle = async (
    hasPermission: boolean | null,
    requestPermission: () => Promise<boolean>
  ) => {
    await handleToggleFeature({
      isOn: isVoiceOn,
      setIsOn: setIsVoiceOn,
      hasPermission,
      requestPermission,
      onEnable: async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          });
          console.log('Voice enabled - microphone is now active');
        } catch (error) {
          console.error('Failed to enable voice:', error);
          Alert.alert(
            'Voice Error',
            'Unable to enable microphone. Please try again.',
            [{ text: 'OK' }]
          );
        }
      },
      onDisable: async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
          console.log('Voice disabled - microphone is now inactive');
        } catch (error) {
          console.error('Failed to disable voice:', error);
        }
      },
      alertTitle: 'Microphone Permission Required',
      alertMessage: 'Please enable microphone access in your device settings to use voice features.',
    });
  };

  const toggleTranscription = () => {
    setIsTranscriptionEnabled(!isTranscriptionEnabled);
  };

  const toggleQuestion = () => {
    setIsQuestionToggleOn(!isQuestionToggleOn);
  };

  const toggleImageInput = () => {
    setIsImageInputEnabled(!isImageInputEnabled);
  };

  const toggleGenerateReport = (onActivate?: () => void) => {
    const newState = !isGenerateReportOn;
    setIsGenerateReportOn(newState);
    if (newState && onActivate) {
      onActivate();
    }
  };

  const togglePreCare = (onActivate?: () => void) => {
    const newState = !isPreCareToggleOn;
    setIsPreCareToggleOn(newState);
    if (newState && onActivate) {
      onActivate();
    }
  };

  return {
    isCameraOn,
    isVoiceOn,
    isTranscriptionEnabled,
    isQuestionToggleOn,
    isImageInputEnabled,
    isGenerateReportOn,
    isPreCareToggleOn,
    setIsQuestionToggleOn,
    setIsPreCareToggleOn,
    handleCameraToggle,
    handleVoiceToggle,
    toggleTranscription,
    toggleQuestion,
    toggleImageInput,
    toggleGenerateReport,
    togglePreCare,
  };
}