import { SupervisorThemeProvider } from '@/contexts/SupervisorThemeContext';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { NotificationsProvider } from '../constants/notifications'; // <-- ADD THIS
import { RequestsProvider } from '../constants/studData';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SupervisorThemeProvider>
      <RequestsProvider>
        <NotificationsProvider> 
          <Slot />
        </NotificationsProvider>
      </RequestsProvider>
    </SupervisorThemeProvider>
  );
}