import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

export function useLocation() {
  const [isLocationOn, setIsLocationOn] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      setIsLocationLoading(false);
      console.log('Current location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setIsLocationLoading(false);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK', onPress: () => setIsLocationOn(false) }]
      );
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This feature requires location access. Please enable it in your device settings.',
        [{ text: 'OK', onPress: () => setIsLocationOn(false) }]
      );
      setIsLocationOn(false);
      setIsLocationLoading(false);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const requestAndFetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        await getCurrentLocation();
      }
    };

    requestAndFetchLocation();
  }, []);

  return {
    isLocationOn,
    setIsLocationOn,
    currentLocation,
    isLocationLoading,
    getCurrentLocation,
    requestLocationPermission,
  };
}