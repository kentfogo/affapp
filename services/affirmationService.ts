import { Affirmation, AffirmationCategory } from '../types/affirmation';
import affirmationsData from '../data/affirmations.json';

class AffirmationService {
  private categories: AffirmationCategory[] = [];

  constructor() {
    this.loadAffirmations();
  }

  private loadAffirmations(): void {
    const data = affirmationsData as Record<string, Array<{ id: number; text: string }>>;
    
    this.categories = Object.entries(data).map(([categoryName, items]) => ({
      name: categoryName,
      affirmations: items.map((item) => ({
        id: item.id,
        text: item.text,
        category: categoryName,
        isCustom: false,
      })),
    }));
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

  getAffirmationById(id: number): Affirmation | undefined {
    return this.getAllAffirmations().find((aff) => aff.id === id);
  }

  searchAffirmations(query: string): Affirmation[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllAffirmations().filter((aff) =>
      aff.text.toLowerCase().includes(lowerQuery)
    );
  }
}

export const affirmationService = new AffirmationService();

