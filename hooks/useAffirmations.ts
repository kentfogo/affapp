import { useState, useMemo, useEffect } from 'react';
import { affirmationService } from '../services/affirmationService';
import { storageService } from '../services/storageService';
import { useSessionStore } from '../store/sessionStore';
import { Affirmation } from '../types/affirmation';

interface UseAffirmationsOptions {
  selectedGoals?: string[];
  autoLoad?: boolean;
}

export const useAffirmations = (options: UseAffirmationsOptions = {}) => {
  const { selectedGoals = [], autoLoad = true } = options;
  const { selectedAffirmations, setSelectedAffirmations } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted affirmations on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      const loadPersisted = async () => {
        try {
          const persisted = await storageService.getSelectedAffirmations();
          if (persisted.length > 0) {
            setSelectedAffirmations(persisted);
          }
        } catch (error) {
          console.error('Error loading persisted affirmations:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadPersisted();
    } else {
      setIsLoading(false);
    }
  }, [autoLoad, setSelectedAffirmations]);

  // Filter affirmations by selected goals/categories
  const filteredAffirmations = useMemo(() => {
    return affirmationService.getFilteredAffirmations(selectedGoals);
  }, [selectedGoals]);

  const addAffirmation = async (affirmation: Affirmation) => {
    if (selectedAffirmations.length >= 10) {
      throw new Error('Maximum of 10 affirmations allowed');
    }
    if (selectedAffirmations.some(a => a.id === affirmation.id)) {
      return; // Already selected
    }
    const updated = [...selectedAffirmations, affirmation];
    setSelectedAffirmations(updated);
    await storageService.saveSelectedAffirmations(updated);
  };

  const removeAffirmation = async (affirmationId: string) => {
    const updated = selectedAffirmations.filter(aff => aff.id !== affirmationId);
    setSelectedAffirmations(updated);
    await storageService.saveSelectedAffirmations(updated);
  };

  const clearAffirmations = async () => {
    setSelectedAffirmations([]);
    await storageService.saveSelectedAffirmations([]);
  };

  const toggleAffirmation = async (affirmation: Affirmation) => {
    const isSelected = selectedAffirmations.some(a => a.id === affirmation.id);
    if (isSelected) {
      await removeAffirmation(affirmation.id);
    } else {
      await addAffirmation(affirmation);
    }
  };

  const isSelected = (affirmationId: string) => {
    return selectedAffirmations.some(a => a.id === affirmationId);
  };

  return {
    allAffirmations: filteredAffirmations,
    selectedAffirmations,
    isLoading,
    addAffirmation,
    removeAffirmation,
    clearAffirmations,
    toggleAffirmation,
    isSelected,
    canStartSession: selectedAffirmations.length >= 1 && selectedAffirmations.length <= 10,
    selectedCount: selectedAffirmations.length,
  };
};

