import OpenAI from "openai";

// ChatGPT 3.5 for AI-powered search analysis
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 0 // No timeout - let AI complete naturally
});

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
  private getSmartFallbackAnalysis(query: string): SearchAnalysis {
    const lowercaseQuery = query.toLowerCase();
    
    // Enhanced semantic mapping for better understanding
    const semanticMappings = {
      // Tech and computers
      'computer': { intent: 'computing device rental', keywords: ['computer', 'laptop', 'pc'], categories: ['Electronics'], synonyms: ['laptop', 'macbook', 'pc', 'desktop', 'notebook'], relatedTerms: ['macbook', 'laptop', 'gaming pc', 'workstation', 'tablet'] },
      'laptop': { intent: 'portable computer rental', keywords: ['laptop', 'computer'], categories: ['Electronics'], synonyms: ['macbook', 'notebook', 'computer'], relatedTerms: ['macbook pro', 'gaming laptop', 'business laptop'] },
      'macbook': { intent: 'apple laptop rental', keywords: ['macbook', 'apple', 'laptop'], categories: ['Electronics'], synonyms: ['laptop', 'computer', 'apple'], relatedTerms: ['macbook pro', 'macbook air', 'laptop'] },
      
      // Audio devices
      'airpods': { intent: 'wireless earbuds for rent', keywords: ['airpods', 'earbuds', 'wireless', 'headphones'], categories: ['Electronics'], synonyms: ['airpods', 'earpods', 'wireless earphones', 'bluetooth earbuds'], relatedTerms: ['headphones', 'bluetooth headphones', 'wireless headphones', 'earphones'] },
      'headphones': { intent: 'audio equipment rental', keywords: ['headphones', 'audio'], categories: ['Electronics'], synonyms: ['headphones', 'earphones', 'headset'], relatedTerms: ['wireless', 'bluetooth', 'noise cancelling'] },
      
      // Electronics general
      'electronics': { intent: 'various electronics and gadgets', keywords: ['electronics', 'gadgets', 'devices'], categories: ['Electronics', 'Gaming', 'Photography'], synonyms: ['gadgets', 'devices', 'tech', 'gear'], relatedTerms: ['smartphones', 'laptops', 'drones', 'gaming consoles'] },
      'cool': { intent: 'interesting or trendy items', keywords: ['cool', 'awesome', 'interesting'], categories: ['Electronics', 'Photography', 'Sports'], synonyms: ['awesome', 'amazing', 'trendy', 'popular'], relatedTerms: ['camera', 'drone', 'gaming', 'tech', 'gadget'] },
      
      // Tools
      'tool': { intent: 'construction and repair tools', keywords: ['tool', 'tools'], categories: ['Tools'], synonyms: ['equipment', 'instrument'], relatedTerms: ['drill', 'saw', 'hammer', 'screwdriver'] },
      
      // Gaming
      'gaming': { intent: 'gaming equipment rental', keywords: ['gaming', 'game'], categories: ['Electronics'], synonyms: ['video games', 'console'], relatedTerms: ['playstation', 'xbox', 'nintendo', 'pc gaming'] },
    };
    
    // Find best match
    for (const [key, mapping] of Object.entries(semanticMappings)) {
      if (lowercaseQuery.includes(key)) {
        return mapping;
      }
    }
    
    // General fallback with basic keyword extraction
    const words = lowercaseQuery.split(' ').filter(word => word.length > 2);
    return {
      intent: `rental items related to ${query}`,
      keywords: words,
      categories: ['Electronics', 'Tools', 'Sports'],
      synonyms: words,
      relatedTerms: words
    };
  }

  async analyzeSearchQuery(query: string): Promise<SearchAnalysis> {
    // Start timer for 2-second timeout
    const timeout = new Promise<SearchAnalysis>((_, reject) => {
      setTimeout(() => {
        console.log(`⏰ AI search timeout after 2 seconds for query: "${query}"`);
        reject(new Error('AI search timeout'));
      }, 2000); // 2 second timeout
    });

    const aiAnalysis = async (): Promise<SearchAnalysis> => {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI search assistant for a rental marketplace. Analyze search queries and return JSON with:
            {
              "intent": "what the user wants to rent",
              "keywords": ["main search terms"],
              "categories": ["relevant categories"],
              "synonyms": ["alternative terms"],
              "relatedTerms": ["related items"]
            }`
          },
          {
            role: "user",
            content: `Analyze this search query: "${query}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response');
      
      return JSON.parse(content);
    };

    try {
      // Race between AI response and timeout
      const result = await Promise.race([aiAnalysis(), timeout]);
      console.log(`✅ AI search completed for query: "${query}"`);
      return result;
    } catch (error) {
      // Use smart fallback with enhanced semantic understanding
      console.log(`🔄 Using smart fallback analysis for: "${query}"`);
      return this.getSmartFallbackAnalysis(query);
    }
  }

  async scoreItemRelevance(items: any[], searchAnalysis: SearchAnalysis): Promise<ItemMatch[]> {
    const scoredItems: ItemMatch[] = [];

    for (const item of items) {
      let score = 0;
      const reasons: string[] = [];

      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const fullText = `${titleLower} ${descLower}`;
      
      // Enhanced semantic matching
      // Direct keyword matches (highest score)
      for (const keyword of searchAnalysis.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (titleLower.includes(keywordLower)) {
          score += 15;
          reasons.push(`Title contains "${keyword}"`);
        } else if (descLower.includes(keywordLower)) {
          score += 8;
          reasons.push(`Description contains "${keyword}"`);
        }
      }

      // Synonym matches with semantic understanding
      for (const synonym of searchAnalysis.synonyms) {
        const synonymLower = synonym.toLowerCase();
        if (titleLower.includes(synonymLower)) {
          score += 12;
          reasons.push(`Title matches synonym "${synonym}"`);
        } else if (descLower.includes(synonymLower)) {
          score += 6;
          reasons.push(`Description matches synonym "${synonym}"`);
        }
      }

      // Related term matches
      for (const term of searchAnalysis.relatedTerms) {
        const termLower = term.toLowerCase();
        if (titleLower.includes(termLower)) {
          score += 10;
          reasons.push(`Title contains related term "${term}"`);
        } else if (descLower.includes(termLower)) {
          score += 5;
          reasons.push(`Description contains related term "${term}"`);
        }
      }

      // Brand recognition boost
      const premiumBrands = ['apple', 'macbook', 'canon', 'nikon', 'sony', 'gaming'];
      for (const brand of premiumBrands) {
        if (fullText.includes(brand)) {
          score += 3;
          reasons.push(`Premium brand: ${brand}`);
        }
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

    try {
      // Analyze the search query with AI (with built-in timeout)
      const searchAnalysis = await this.analyzeSearchQuery(query);
      console.log('AI Search Analysis:', searchAnalysis);

      // Score items based on AI analysis (fast scoring)
      const scoredItems = await this.scoreItemRelevance(allItems, searchAnalysis);
      
      // Return top matches with scores above threshold
      const relevantItems = scoredItems
        .filter(item => item.score >= 5) // Lower threshold for better matches
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

      // If we have good results, return them
      if (relevantItems.length > 0) {
        return relevantItems;
      }

      // Return empty array if no matches
      return [];
    } catch (error) {
      console.error(`❌ AI search error for "${query}":`, error);
      return [];
    }
  }
}

export const aiSearchService = new AISearchService();
