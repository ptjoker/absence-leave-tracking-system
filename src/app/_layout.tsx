import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep the splash visible while we load the app.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Dismiss the splash as soon as the layout is ready.
    SplashScreen.hideAsync();
  }, []);

  // <Slot /> renders whichever route matches the current URL.
  // No tab bar here — each screen owns its own navigation.
  return <Slot />;
}