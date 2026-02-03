import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../services/firebase';
import { useMoodStore } from '../store/moodStore';
import { notificationService } from '../services/notificationService';

export default function RootLayout() {
  const { loadMoods } = useMoodStore();

  useEffect(() => {
    loadMoods();
    notificationService.initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

