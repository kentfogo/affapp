import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { affirmationService } from '../../services/affirmationService';
import { storageService } from '../../services/storageService';
import { useSessionStore } from '../../store/sessionStore';
import { Affirmation } from '../../types/affirmation';

export default function ListScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAffirmations, setSelectedAffirmations } = useSessionStore();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [customAffirmations, setCustomAffirmations] = useState<Affirmation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const allAffirmations = affirmationService.getAllAffirmations();
      const allCategories = affirmationService.getAllCategories().map(c => c.name);

      // Load custom affirmations from storage
      const savedCustom = await storageService.getCustomAffirmations();
      setCustomAffirmations(savedCustom);

      // Combine standard and custom affirmations
      setAffirmations([...savedCustom, ...allAffirmations]);
      setCategories(['Custom', ...allCategories]);

      // Load currently selected affirmations
      const currentSelectedIds = new Set(selectedAffirmations.map(a => a.id));
      setSelectedIds(currentSelectedIds);
    };
    loadData();
  }, [selectedAffirmations]);

  const handleAddAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert('Error', 'Please enter an affirmation');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newAffirmation: Affirmation = {
      id: `custom_${Date.now()}`,
      text: newAffirmationText.trim(),
      category: 'Custom',
      isCustom: true,
    };

    const updatedCustom = [...customAffirmations, newAffirmation];
    setCustomAffirmations(updatedCustom);
    setAffirmations([...updatedCustom, ...affirmationService.getAllAffirmations()]);

    // Save to storage
    await storageService.saveCustomAffirmations(updatedCustom);

    setNewAffirmationText('');
    setShowAddModal(false);
  };

  const toggleAffirmation = async (affirmation: Affirmation) => {
    await Haptics.selectionAsync();

    const newSelectedIds = new Set(selectedIds);

    if (newSelectedIds.has(affirmation.id)) {
      // Deselect
      newSelectedIds.delete(affirmation.id);
    } else {
      // Select - check max limit
      if (newSelectedIds.size >= 10) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      newSelectedIds.add(affirmation.id);
    }

    setSelectedIds(newSelectedIds);

    // Update store and persist
    const newSelectedAffirmations = affirmations.filter(a => newSelectedIds.has(a.id));
    setSelectedAffirmations(newSelectedAffirmations);
    await storageService.saveSelectedAffirmations(newSelectedAffirmations);
  };

  const filteredAffirmations = selectedCategory
    ? affirmations.filter(a => a.category === selectedCategory)
    : affirmations;

  const renderAffirmation = ({ item, index }: { item: Affirmation; index: number }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.affirmationItem, isSelected && styles.affirmationItemSelected]}
        onPress={() => toggleAffirmation(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={COLORS.surface} />
          )}
        </View>
        <View style={styles.affirmationContent}>
          <Text style={[styles.affirmationText, isSelected && styles.affirmationTextSelected]}>
            {item.text}
          </Text>
          <Text style={styles.categoryTag}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={['All', ...categories]}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.categoryList}
      renderItem={({ item }) => {
        const isActive = item === 'All' ? !selectedCategory : selectedCategory === item;
        return (
          <TouchableOpacity
            style={[styles.categoryChip, isActive && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
          >
            <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>List</Text>
            <Text style={styles.headerSubtitle}>
              {selectedIds.size}/10 selected
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={28} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Affirmation Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Affirmation</Text>
            <TouchableOpacity onPress={handleAddAffirmation}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Your Affirmation</Text>
            <TextInput
              style={styles.textInput}
              placeholder="I am capable of achieving my goals..."
              placeholderTextColor={COLORS.textSecondary}
              value={newAffirmationText}
              onChangeText={setNewAffirmationText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>

      {/* Success Message when 10 selected */}
      {selectedIds.size >= 10 && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.surface} />
          <Text style={styles.successText}>Good Job! You've Selected All of your Affirmations.</Text>
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        {renderCategoryFilter()}
      </View>

      {/* Affirmations List */}
      <FlatList
        data={filteredAffirmations}
        keyExtractor={(item) => item.id}
        renderItem={renderAffirmation}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalSave: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.surface,
  },
  listContent: {
    padding: 16,
  },
  affirmationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  affirmationItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  affirmationContent: {
    flex: 1,
  },
  affirmationText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  affirmationTextSelected: {
    color: COLORS.text,
    fontWeight: '500',
  },
  categoryTag: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
