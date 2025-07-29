import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import CustomSplashScreen from '@/components/SplashScreen';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (loaded) {
          // Keep splash visible for minimum duration
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Hide native splash screen
          await SplashScreen.hideAsync();
          
          // Set app as ready and navigate to welcome
          setAppIsReady(true);
          
          // Navigate to welcome screen after splash with more space/delay
          setTimeout(() => {
            router.replace('/welcome');
          }, 500);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loaded, router]);

  if (!appIsReady) {
    // Show custom splash screen
    return <CustomSplashScreen />;
  }

  // This won't be shown as we navigate away, but kept for safety
  return <CustomSplashScreen />;
}