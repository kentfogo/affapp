import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAffirmationAnalyticsStore } from '../../store/affirmationAnalyticsStore';
import { affirmationService } from '../../services/affirmationService';
import { storageService } from '../../services/storageService';
import { Affirmation } from '../../types/affirmation';
import SwipeableAffirmationCard from '../../components/SwipeableAffirmationCard';
import { COLORS } from '../../constants/colors';

export default function AffirmationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: onboardingData, selectedAffirmationIds, saveSelectedAffirmations } = useOnboardingStore();
  const { selectedAffirmations, setSelectedAffirmations } = useSessionStore();
  const { trackAccept, trackReject, loadAnalytics } = useAffirmationAnalyticsStore();

  const [filteredAffirmations, setFilteredAffirmations] = useState<Affirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const doneButtonScale = new Animated.Value(0);
  const isButtonVisible = useRef(false);

  useEffect(() => {
    loadAnalytics();
    loadAffirmations();
    loadExistingSelections();
  }, []);

  useEffect(() => {
    // Show Done button only when 5+ affirmations are selected
    const shouldShow = selectedIds.size >= 5;
    
    // Only animate if state is changing to prevent flashing
    if (shouldShow && !isButtonVisible.current) {
      isButtonVisible.current = true;
      Animated.spring(doneButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && isButtonVisible.current) {
      isButtonVisible.current = false;
      Animated.timing(doneButtonScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedIds.size]);

  const loadExistingSelections = async () => {
    try {
      let loadedIds: Set<string> = new Set();
      
      // Try to load from session store first (full objects)
      if (selectedAffirmations.length > 0) {
        loadedIds = new Set(selectedAffirmations.map(a => a.id));
      } else if (selectedAffirmationIds.length > 0) {
        // Try onboarding store (IDs array)
        loadedIds = new Set(selectedAffirmationIds);
      } else {
        // Try storage service
        const stored = await storageService.getSelectedAffirmations();
        if (stored.length > 0) {
          loadedIds = new Set(stored.map(a => a.id));
        }
      }
      
      if (loadedIds.size > 0) {
        setSelectedIds(loadedIds);
        // Initialize button visibility if 5+ affirmations already selected
        if (loadedIds.size >= 5) {
          isButtonVisible.current = true;
          doneButtonScale.setValue(1);
        }
      }
    } catch (error) {
      console.error('Error loading existing selections:', error);
    }
  };

  const loadAffirmations = async () => {
    try {
      setIsLoading(true);
      const categories = onboardingData?.preferredCategories || [];
      const filtered = affirmationService.getFilteredAffirmations(categories);
      setFilteredAffirmations(filtered);
    } catch (error) {
      Alert.alert('Error', 'Failed to load affirmations');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeRight = async () => {
    // Accept affirmation
    await Haptics.selectionAsync();
    const affirmation = filteredAffirmations[currentIndex];
    
    // Track analytics
    trackAccept(affirmation.id);
    
    // Check if already at max (10)
    if (selectedIds.size >= 10) {
      Alert.alert('Maximum Reached', 'You can select up to 10 affirmations');
      return;
    }
    
    setSelectedIds(prev => new Set([...prev, affirmation.id]));

    if (currentIndex < filteredAffirmations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('Done', 'You\'ve reviewed all affirmations!');
    }
  };

  const handleSwipeLeft = async () => {
    // Reject affirmation
    await Haptics.selectionAsync();
    const affirmation = filteredAffirmations[currentIndex];
    
    // Track analytics
    trackReject(affirmation.id);
    
    if (currentIndex < filteredAffirmations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('Done', 'You\'ve reviewed all affirmations!');
    }
  };

  const handleDone = async () => {
    // Require at least 5 affirmations
    if (selectedIds.size < 5) {
      Alert.alert('Minimum Required', 'Please select at least 5 affirmations');
      return;
    }

    if (selectedIds.size > 10) {
      Alert.alert('Too Many', 'Please select no more than 10 affirmations');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const selectedArray = Array.from(selectedIds);
      
      // Save to onboarding store (IDs)
      await saveSelectedAffirmations(selectedArray);

      // Get full affirmation objects
      const selectedAffirmationObjects = filteredAffirmations.filter(aff =>
        selectedIds.has(aff.id)
      );
      
      // Set in session store (full objects)
      setSelectedAffirmations(selectedAffirmationObjects);
      
      // Persist to storage
      await storageService.saveSelectedAffirmations(selectedAffirmationObjects);

      // Navigate back directly without showing alert
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save selections. Please try again.');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading affirmations...</Text>
      </View>
    );
  }

  const currentAffirmation = filteredAffirmations[currentIndex];
  const progressPercent = ((currentIndex + 1) / filteredAffirmations.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Affirmations</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {filteredAffirmations.length}
        </Text>
      </View>

      {/* Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {selectedIds.size}/10 selected
        </Text>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {currentAffirmation && (
          <SwipeableAffirmationCard
            affirmation={currentAffirmation}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            isLast={currentIndex === filteredAffirmations.length - 1}
          />
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Swipe right to accept, left to reject
        </Text>
      </View>

      {/* Done Button */}
      <Animated.View
        style={[
          styles.doneButtonContainer,
          {
            transform: [{ scale: doneButtonScale }],
            opacity: doneButtonScale,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  doneButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  doneButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
});

