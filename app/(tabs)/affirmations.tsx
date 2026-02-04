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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAffirmationAnalyticsStore } from '../../store/affirmationAnalyticsStore';
import { affirmationService } from '../../services/affirmationService';
import { storageService } from '../../services/storageService';
import { Affirmation } from '../../types/affirmation';
import { SwipeableAffirmationCard } from '../../components/SwipeableAffirmationCard';
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
  const currentIndexRef = useRef(0);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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
    // Accept affirmation - use ref to get current index to avoid closure issues
    await Haptics.selectionAsync();
    const index = currentIndexRef.current;
    const affirmation = filteredAffirmations[index];

    if (!affirmation) {
      console.log('No affirmation at index:', index);
      return;
    }

    console.log('Accepting affirmation:', affirmation.id, 'at index:', index);

    // Track analytics
    trackAccept(affirmation.id);

    // Only add if not already selected
    setSelectedIds((prev) => {
      // Already selected: just return previous set
      if (prev.has(affirmation.id)) {
        console.log('Already selected:', affirmation.id);
        return prev;
      }

      // Enforce maximum of 10 selections
      if (prev.size >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 affirmations');
        return prev;
      }

      console.log('Adding to selected:', affirmation.id, 'new count:', prev.size + 1);
      return new Set([...prev, affirmation.id]);
    });

    // Always advance to next card if available
    setCurrentIndex((prev) => {
      if (prev < filteredAffirmations.length - 1) {
        const next = prev + 1;
        currentIndexRef.current = next;
        return next;
      }
      Alert.alert('Done', 'You\'ve reviewed all affirmations!');
      return prev;
    });
  };

  const handleSwipeLeft = async () => {
    // Reject affirmation - use ref to get current index to avoid closure issues
    await Haptics.selectionAsync();
    const index = currentIndexRef.current;
    const affirmation = filteredAffirmations[index];

    if (!affirmation) {
      console.log('No affirmation at index:', index);
      return;
    }

    console.log('Rejecting affirmation:', affirmation.id, 'at index:', index);

    // Track analytics
    trackReject(affirmation.id);

    // Always advance to next card if available
    setCurrentIndex((prev) => {
      if (prev < filteredAffirmations.length - 1) {
        const next = prev + 1;
        currentIndexRef.current = next;
        return next;
      }
      Alert.alert('Done', 'You\'ve reviewed all affirmations!');
      return prev;
    });
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
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.navTitle}>Library</Text>
        <View style={styles.navIcons}>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="search-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="options-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Affirmations</Text>
        <Text style={styles.subtitle}>Swipe to choose your daily mantras</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {currentIndex >= filteredAffirmations.length ? (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>
              All done! You selected {selectedIds.size} affirmations.
            </Text>
          </View>
        ) : (
          <>
            {/* Next card behind current */}
            {currentIndex < filteredAffirmations.length - 1 && (
              <SwipeableAffirmationCard
                affirmation={filteredAffirmations[currentIndex + 1]}
                onSwipeLeft={() => {}}
                onSwipeRight={() => {}}
                isFirst={false}
              />
            )}
            {/* Current card (swipeable) */}
            {currentAffirmation && (
              <SwipeableAffirmationCard
                affirmation={currentAffirmation}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                isFirst={true}
              />
            )}
          </>
        )}
      </View>

      {/* Counter (moved below cards so it can't be covered) */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {selectedIds.size}/10 selected
        </Text>
      </View>

      {/* Tap Buttons for Accept / Reject */}
      {currentIndex < filteredAffirmations.length && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleSwipeLeft}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleSwipeRight}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      )}

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
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  navIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconButton: {
    padding: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 16,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  completedContainer: {
    padding: 40,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 80,
    marginTop: 16,
    marginBottom: 8,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#E53935',
  },
  acceptButton: {
    backgroundColor: '#43A047',
  },
  actionButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
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

