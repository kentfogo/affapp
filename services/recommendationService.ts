import { affirmationService } from './affirmationService';
import { useAffirmationAnalyticsStore } from '../store/affirmationAnalyticsStore';
import { Affirmation } from '../types/affirmation';

class RecommendationService {
  // Get affirmations that haven't been shown recently (weekly rotation)
  getFreshAffirmations(selectedIds: string[], limit = 10): Affirmation[] {
    const { analytics } = useAffirmationAnalyticsStore.getState();
    const selectedSet = new Set(selectedIds);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const allAffirmations = affirmationService.getAllAffirmations();
    
    // Filter out selected and recently shown affirmations
    const fresh = allAffirmations.filter(aff => {
      if (selectedSet.has(aff.id)) return false;
      const stats = analytics[aff.id];
      if (stats && stats.lastShown > oneWeekAgo) return false;
      return true;
    });
    
    return fresh.slice(0, limit);
  }

  // Get recommendations based on user's selected affirmations
  getSimilarRecommendations(selectedIds: string[], limit = 5): Affirmation[] {
    const selected = affirmationService.getAllAffirmations().filter(a => 
      selectedIds.includes(a.id)
    );
    
    if (selected.length === 0) {
      return this.getPopularAffirmations(limit);
    }
    
    // Get categories of selected affirmations
    const categories = new Set(selected.map(a => a.category));
    
    // Find affirmations in same categories
    const allAffirmations = affirmationService.getAllAffirmations();
    const selectedSet = new Set(selectedIds);
    
    const similar = allAffirmations
      .filter(aff => 
        !selectedSet.has(aff.id) && 
        categories.has(aff.category)
      )
      .slice(0, limit);
    
    return similar;
  }

  // Get popular affirmations (most replayed)
  getPopularAffirmations(limit = 5): Affirmation[] {
    const { getMostReplayed } = useAffirmationAnalyticsStore.getState();
    const popularIds = getMostReplayed(limit);
    return affirmationService.getAllAffirmations()
      .filter(aff => popularIds.includes(aff.id));
  }

  // Get "People with similar goals also love" recommendations
  getCommunityRecommendations(selectedIds: string[], limit = 5): Affirmation[] {
    // This would ideally use cloud data, but for now use similar logic
    return this.getSimilarRecommendations(selectedIds, limit);
  }
}

export const recommendationService = new RecommendationService();





