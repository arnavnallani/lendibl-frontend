import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SearchAnalysis {
  intent: string;
  keywords: string[];
  categories: string[];
  synonyms: string[];
  relatedTerms: string[];
}

export interface ItemMatch {
  id: number;
  title: string;
  description: string;
  score: number;
  reason: string;
}

export class AISearchService {
  async analyzeSearchQuery(query: string): Promise<SearchAnalysis> {
    try {
      const prompt = `Analyze this search query for a rental marketplace: "${query}"

Return JSON with:
- intent: What the user is looking for (be specific)
- keywords: Key terms from the query
- categories: Likely rental categories (Tools, Electronics, Sports, Outdoor, Photography, etc.)
- synonyms: Alternative words for the same items
- relatedTerms: Related items they might also want

Examples:
- "need something to fix my fence" → intent: "tool for fence repair", keywords: ["fix", "fence"], categories: ["Tools"], synonyms: ["repair", "build", "construct"], relatedTerms: ["drill", "saw", "hammer", "screwdriver"]
- "going camping this weekend" → intent: "camping equipment rental", keywords: ["camping", "weekend"], categories: ["Outdoor", "Sports"], synonyms: ["outdoor", "hiking", "backpacking"], relatedTerms: ["tent", "sleeping bag", "lantern", "stove"]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              categories: { type: "array", items: { type: "string" } },
              synonyms: { type: "array", items: { type: "string" } },
              relatedTerms: { type: "array", items: { type: "string" } }
            },
            required: ["intent", "keywords", "categories", "synonyms", "relatedTerms"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error) {
      console.error('AI search analysis failed:', error);
      // Fallback to basic keyword extraction
      const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      return {
        intent: query,
        keywords: words,
        categories: [],
        synonyms: words,
        relatedTerms: words
      };
    }
  }

  async scoreItemRelevance(items: any[], searchAnalysis: SearchAnalysis): Promise<ItemMatch[]> {
    const scoredItems: ItemMatch[] = [];

    for (const item of items) {
      let score = 0;
      const reasons: string[] = [];

      // Check title matches
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      
      // Exact keyword matches in title (highest score)
      for (const keyword of searchAnalysis.keywords) {
        if (titleLower.includes(keyword.toLowerCase())) {
          score += 10;
          reasons.push(`Title contains "${keyword}"`);
        }
      }

      // Synonym matches in title
      for (const synonym of searchAnalysis.synonyms) {
        if (titleLower.includes(synonym.toLowerCase())) {
          score += 8;
          reasons.push(`Title matches synonym "${synonym}"`);
        }
      }

      // Related term matches in title
      for (const term of searchAnalysis.relatedTerms) {
        if (titleLower.includes(term.toLowerCase())) {
          score += 6;
          reasons.push(`Title contains related term "${term}"`);
        }
      }

      // Description matches (lower weight)
      for (const keyword of searchAnalysis.keywords) {
        if (descLower.includes(keyword.toLowerCase())) {
          score += 3;
          reasons.push(`Description contains "${keyword}"`);
        }
      }

      // Category relevance
      // This would need category name lookup, simplified for now
      if (searchAnalysis.categories.length > 0) {
        score += 2;
        reasons.push('Category relevance');
      }

      if (score > 0) {
        scoredItems.push({
          id: item.id,
          title: item.title,
          description: item.description,
          score,
          reason: reasons.join(', ')
        });
      }
    }

    // Sort by score descending
    return scoredItems.sort((a, b) => b.score - a.score);
  }

  async enhancedSearch(query: string, allItems: any[]): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Analyze the search query with AI
    const searchAnalysis = await this.analyzeSearchQuery(query);
    console.log('AI Search Analysis:', searchAnalysis);

    // Score items based on AI analysis
    const scoredItems = await this.scoreItemRelevance(allItems, searchAnalysis);
    
    // Return top matches with scores above threshold
    const relevantItems = scoredItems
      .filter(item => item.score >= 3)
      .slice(0, 10)
      .map(match => {
        const originalItem = allItems.find(item => item.id === match.id);
        return {
          ...originalItem,
          aiScore: match.score,
          aiReason: match.reason
        };
      });

    console.log(`AI Search found ${relevantItems.length} relevant items for "${query}"`);
    return relevantItems;
  }
}

export const aiSearchService = new AISearchService();