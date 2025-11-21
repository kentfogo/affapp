import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSessionStore } from '../../store/sessionStore';
import { affirmationService } from '../../services/affirmationService';
import { storageService } from '../../services/storageService';
import { Affirmation } from '../../types/affirmation';
import { COLORS } from '../../constants/colors';

export default function LibraryScreen() {
  const { selectedAffirmations, setSelectedAffirmations } = useSessionStore();
  const [categories, setCategories] = useState(affirmationService.getAllCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);

  useEffect(() => {
    loadSelectedAffirmations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const searchResults = affirmationService.searchAffirmations(searchQuery);
      // Group by category
      const grouped: Record<string, Affirmation[]> = {};
      searchResults.forEach((aff) => {
        if (!grouped[aff.category]) {
          grouped[aff.category] = [];
        }
        grouped[aff.category].push(aff);
      });
      setFilteredCategories(
        Object.entries(grouped).map(([name, affirmations]) => ({
          name,
          affirmations,
        }))
      );
    }
  }, [searchQuery, categories]);

  const loadSelectedAffirmations = async () => {
    const saved = await storageService.getSelectedAffirmations();
    setSelectedAffirmations(saved);
  };

  const toggleAffirmation = async (affirmation: Affirmation) => {
    const isSelected = selectedAffirmations.some((a) => a.id === affirmation.id);
    let updated: Affirmation[];

    if (isSelected) {
      updated = selectedAffirmations.filter((a) => a.id !== affirmation.id);
    } else {
      if (selectedAffirmations.length >= 10) {
        alert('You can select a maximum of 10 affirmations');
        return;
      }
      updated = [...selectedAffirmations, affirmation];
    }

    setSelectedAffirmations(updated);
    await storageService.saveSelectedAffirmations(updated);
  };

  const isSelected = (affirmation: Affirmation) => {
    return selectedAffirmations.some((a) => a.id === affirmation.id);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>
            Select 5-10 affirmations ({selectedAffirmations.length}/10)
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search affirmations..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.content}>
        {filteredCategories.map((category) => (
          <View key={category.name} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.affirmations.map((affirmation) => {
              const selected = isSelected(affirmation);
              return (
                <TouchableOpacity
                  key={affirmation.id}
                  style={[
                    styles.affirmationCard,
                    selected && styles.affirmationCardSelected,
                  ]}
                  onPress={() => toggleAffirmation(affirmation)}
                >
                  <Text
                    style={[
                      styles.affirmationText,
                      selected && styles.affirmationTextSelected,
                    ]}
                  >
                    {affirmation.text}
                  </Text>
                  {selected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.text,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  affirmationCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  affirmationCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  affirmationText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    paddingRight: 32,
  },
  affirmationTextSelected: {
    color: COLORS.text,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

