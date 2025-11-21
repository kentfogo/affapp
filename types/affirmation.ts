export interface Affirmation {
  id: string;
  text: string;
  category: string;
  isCustom?: boolean;
  audioUri?: string;
}

export interface AffirmationCategory {
  name: string;
  affirmations: Affirmation[];
}

export interface CachedAffirmation extends Affirmation {
  cachedAt: number;
  audioDownloaded?: boolean;
  audioPath?: string;
}

export interface AffirmationSelectionState {
  selectedIds: string[];
  selectedAt: number;
}

