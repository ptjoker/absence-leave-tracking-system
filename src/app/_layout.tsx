import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SupervisorThemeProvider } from '@/contexts/SupervisorThemeContext';
import { RequestsProvider } from '../constants/studData';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SupervisorThemeProvider>
      <RequestsProvider>
        <Slot />
      </RequestsProvider>
    </SupervisorThemeProvider>
  );
}