import { storage } from "./storage";
import type { ItemWithDetails, UserInteraction, UserPreferences, User } from "@shared/schema";

export interface RecommendationScore {
  itemId: number;
  score: number;
  reasons: string[];
}

export interface RecommendationResult {
  items: ItemWithDetails[];
  scores: RecommendationScore[];
}

export class RecommendationEngine {
  
  // Track user interactions for learning preferences
  async trackInteraction(userId: number, itemId: number, interactionType: string, weight: number = 1.0) {
    try {
      await storage.createUserInteraction({
        userId,
        itemId,
        interactionType,
        weight: weight.toString(),
      });
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  }

  // Get personalized recommendations for a user
  async getRecommendations(userId: number, limit: number = 6): Promise<RecommendationResult> {
    try {
      // Get user's interaction history
      const interactions = await storage.getUserInteractions(userId);
      const preferences = await storage.getUserPreferences(userId);
      const user = await storage.getUser(userId);
      
      // Get all available items (excluding user's own items)
      const allItems = await storage.getItems();
      const availableItems = allItems.filter(item => item.ownerId !== userId && item.available);
      
      // Calculate recommendation scores
      const scores = await this.calculateRecommendationScores(
        availableItems,
        interactions,
        preferences,
        user
      );
      
      // Sort by score and get top items
      const topScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      const recommendedItems = topScores.map(score => 
        availableItems.find(item => item.id === score.itemId)!
      );
      
      return {
        items: recommendedItems,
        scores: topScores,
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback to trending items
      return this.getTrendingItems(limit);
    }
  }

  // Calculate recommendation scores based on multiple factors
  private async calculateRecommendationScores(
    items: ItemWithDetails[],
    interactions: UserInteraction[],
    preferences: UserPreferences | null,
    user: User | null
  ): Promise<RecommendationScore[]> {
    
    return items.map(item => {
      let score = 0;
      const reasons: string[] = [];
      
      // 1. Category preference based on interaction history
      const categoryInteractions = interactions.filter(i => 
        items.find(item => item.id === i.itemId)?.categoryId === item.categoryId
      );
      if (categoryInteractions.length > 0) {
        const categoryScore = Math.min(categoryInteractions.length * 0.3, 2.0);
        score += categoryScore;
        reasons.push(`Popular in ${item.category.name}`);
      }
      
      // 2. Price preference alignment
      if (preferences?.priceRangeMin && preferences?.priceRangeMax) {
        const itemPrice = parseFloat(item.price);
        const minPrice = parseFloat(preferences.priceRangeMin);
        const maxPrice = parseFloat(preferences.priceRangeMax);
        
        if (itemPrice >= minPrice && itemPrice <= maxPrice) {
          score += 1.5;
          reasons.push("Within your price range");
        } else if (itemPrice < maxPrice * 1.2) {
          score += 0.5;
          reasons.push("Near your price range");
        }
      }
      
      // 3. Location preference
      if (preferences?.preferredLocations?.includes(item.location)) {
        score += 1.0;
        reasons.push("In your preferred location");
      }
      
      // 4. Item rating and popularity
      const itemRating = parseFloat(item.rating);
      if (itemRating >= 4.0) {
        score += 1.0;
        reasons.push("Highly rated");
      } else if (itemRating >= 3.0) {
        score += 0.5;
      }
      
      // 5. Similar users' preferences (collaborative filtering)
      const similarUserBonus = this.calculateSimilarUserScore(interactions, item);
      score += similarUserBonus;
      if (similarUserBonus > 0.5) {
        reasons.push("Popular with similar users");
      }
      
      // 6. Recency and availability boost
      const createdAt = new Date(item.createdAt);
      const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        score += 0.5;
        reasons.push("Recently listed");
      }
      
      // 7. Random factor to ensure variety
      score += Math.random() * 0.3;
      
      return {
        itemId: item.id,
        score: Math.max(score, 0.1), // Minimum score to ensure variety
        reasons,
      };
    });
  }
  
  // Calculate similarity score based on other users' interactions
  private calculateSimilarUserScore(userInteractions: UserInteraction[], item: ItemWithDetails): number {
    // Simple collaborative filtering based on item views
    const itemViewCount = userInteractions.filter(i => 
      i.itemId === item.id && i.interactionType === 'view'
    ).length;
    
    return Math.min(itemViewCount * 0.2, 1.0);
  }
  
  // Fallback to trending items when personalization fails
  private async getTrendingItems(limit: number): Promise<RecommendationResult> {
    try {
      const items = await storage.getItems();
      const availableItems = items.filter(item => item.available);
      
      // Sort by rating and review count for trending
      const trending = availableItems
        .sort((a, b) => {
          const scoreA = parseFloat(a.rating) * a.reviewCount;
          const scoreB = parseFloat(b.rating) * b.reviewCount;
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      const scores = trending.map((item, index) => ({
        itemId: item.id,
        score: limit - index,
        reasons: ["Trending item"],
      }));
      
      return { items: trending, scores };
    } catch (error) {
      console.error("Error getting trending items:", error);
      return { items: [], scores: [] };
    }
  }
  
  // Update user preferences based on interactions
  async updateUserPreferences(userId: number, categoryId?: number, priceRange?: { min: number; max: number }, location?: string) {
    try {
      const existingPrefs = await storage.getUserPreferences(userId);
      
      let preferredCategories = existingPrefs?.preferredCategories || [];
      let preferredLocations = existingPrefs?.preferredLocations || [];
      
      // Add category if not already preferred
      if (categoryId && !preferredCategories.includes(categoryId)) {
        preferredCategories = [...preferredCategories, categoryId].slice(-5); // Keep last 5
      }
      
      // Add location if not already preferred
      if (location && !preferredLocations.includes(location)) {
        preferredLocations = [...preferredLocations, location].slice(-5); // Keep last 5
      }
      
      const preferencesData = {
        userId,
        preferredCategories,
        priceRangeMin: priceRange?.min.toString() || existingPrefs?.priceRangeMin || "0",
        priceRangeMax: priceRange?.max.toString() || existingPrefs?.priceRangeMax || "1000",
        preferredLocations,
      };
      
      if (existingPrefs) {
        await storage.updateUserPreferences(userId, preferencesData);
      } else {
        await storage.createUserPreferences(preferencesData);
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
    }
  }
}

export const recommendationEngine = new RecommendationEngine();