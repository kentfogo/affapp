import { Affirmation, AffirmationCategory } from '../types/affirmation';
import affirmationsData from '../affirmationslist2.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AffirmationService {
  private categories: AffirmationCategory[] = [];
  private CACHE_KEY = '@cached_affirmations';

  constructor() {
    this.loadAffirmations();
  }

  private loadAffirmations(): void {
    const data = affirmationsData as { affirmations: Affirmation[] };
    
    // Group affirmations by category
    const grouped = data.affirmations.reduce((acc, aff) => {
      const existing = acc.find(c => c.name === aff.category);
      if (existing) {
        existing.affirmations.push(aff);
      } else {
        acc.push({ name: aff.category, affirmations: [aff] });
      }
      return acc;
    }, [] as AffirmationCategory[]);
    
    this.categories = grouped;
  }

  getAllCategories(): AffirmationCategory[] {
    return this.categories;
  }

  getAffirmationsByCategory(categoryName: string): Affirmation[] {
    const category = this.categories.find((cat) => cat.name === categoryName);
    return category ? category.affirmations : [];
  }

  getAllAffirmations(): Affirmation[] {
    return this.categories.flatMap((cat) => cat.affirmations);
  }

  // Filter affirmations by selected categories (goals)
  getFilteredAffirmations(selectedCategories: string[]): Affirmation[] {
    if (selectedCategories.length === 0) {
      return this.getAllAffirmations();
    }
    return this.categories
      .filter(cat => selectedCategories.includes(cat.name))
      .flatMap(cat => cat.affirmations);
  }

  getAffirmationById(id: string): Affirmation | undefined {
    return this.getAllAffirmations().find((aff) => aff.id === id);
  }

  searchAffirmations(query: string): Affirmation[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllAffirmations().filter((aff) =>
      aff.text.toLowerCase().includes(lowerQuery)
    );
  }

  // Offline support
  async cacheAffirmations(affirmations: Affirmation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(affirmations));
    } catch (error) {
      console.error('Error caching affirmations:', error);
    }
  }

  async getCachedAffirmations(): Promise<Affirmation[]> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error retrieving cached affirmations:', error);
      return [];
    }
  }
}

export const affirmationService = new AffirmationService();

