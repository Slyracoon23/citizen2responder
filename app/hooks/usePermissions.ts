import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';

export function usePermissions() {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setHasCamera(granted);
    return granted;
  }, []);

  const requestAudioPermission = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasAudio(granted);
    return granted;
  }, []);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasCamera(cameraStatus === 'granted');
      
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setHasAudio(audioStatus === 'granted');
    })();
  }, []);

  return {
    hasCamera,
    hasAudio,
    requestCameraPermission,
    requestAudioPermission,
  };
}