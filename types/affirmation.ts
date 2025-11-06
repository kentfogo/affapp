export interface Affirmation {
  id: number;
  text: string;
  category: string;
  isCustom?: boolean;
  audioUri?: string;
}

export interface AffirmationCategory {
  name: string;
  affirmations: Affirmation[];
}

