import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { storageService } from '../services/storageService';

export default function Index() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { isComplete, isLoading: onboardingLoading, loadOnboarding } = useOnboardingStore();

  useEffect(() => {
    // Initialize storage and load onboarding data
    const init = async () => {
      await storageService.initialize();
      await loadOnboarding();
    };
    init();
  }, []);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!isComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [user, isComplete, authLoading, onboardingLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

