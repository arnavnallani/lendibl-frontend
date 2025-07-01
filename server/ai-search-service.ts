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
  private getSmartFallbackAnalysis(query: string): SearchAnalysis {
    const lowercaseQuery = query.toLowerCase();
    
    // Enhanced semantic mapping for better understanding
    const semanticMappings = {
      // Tech and computers
      'computer': { intent: 'computing device rental', keywords: ['computer', 'laptop', 'pc'], categories: ['Electronics'], synonyms: ['laptop', 'macbook', 'pc', 'desktop', 'notebook'], relatedTerms: ['macbook', 'laptop', 'gaming pc', 'workstation', 'tablet'] },
      'laptop': { intent: 'portable computer rental', keywords: ['laptop', 'computer'], categories: ['Electronics'], synonyms: ['macbook', 'notebook', 'computer'], relatedTerms: ['macbook pro', 'gaming laptop', 'business laptop'] },
      'macbook': { intent: 'apple laptop rental', keywords: ['macbook', 'apple', 'laptop'], categories: ['Electronics'], synonyms: ['laptop', 'computer', 'apple'], relatedTerms: ['macbook pro', 'macbook air', 'laptop'] },
      
      // Cool/awesome items
      'cool': { intent: 'interesting or trendy items', keywords: ['cool', 'awesome', 'interesting'], categories: ['Electronics', 'Photography', 'Sports'], synonyms: ['awesome', 'amazing', 'trendy', 'popular'], relatedTerms: ['camera', 'drone', 'gaming', 'tech', 'gadget'] },
      'awesome': { intent: 'impressive rental items', keywords: ['awesome', 'cool', 'amazing'], categories: ['Electronics', 'Photography', 'Sports'], synonyms: ['cool', 'amazing', 'impressive'], relatedTerms: ['camera', 'drone', 'gaming', 'sports gear'] },
      'stuff': { intent: 'general items for rent', keywords: ['items', 'things', 'stuff'], categories: ['Tools', 'Electronics', 'Sports'], synonyms: ['items', 'things', 'equipment'], relatedTerms: ['tools', 'electronics', 'gear', 'equipment'] },
      
      // Photography
      'camera': { intent: 'photography equipment', keywords: ['camera', 'photo'], categories: ['Photography', 'Electronics'], synonyms: ['photography', 'photo', 'lens'], relatedTerms: ['dslr', 'mirrorless', 'lens', 'tripod'] },
      'photo': { intent: 'photography equipment', keywords: ['photo', 'camera'], categories: ['Photography'], synonyms: ['photography', 'camera', 'picture'], relatedTerms: ['camera', 'lens', 'lighting', 'tripod'] },
      
      // Tools
      'drill': { intent: 'power tools for projects', keywords: ['drill', 'tool'], categories: ['Tools'], synonyms: ['power drill', 'driver'], relatedTerms: ['screwdriver', 'saw', 'hammer'] },
      'tool': { intent: 'construction and repair tools', keywords: ['tool', 'tools'], categories: ['Tools'], synonyms: ['equipment', 'instrument'], relatedTerms: ['drill', 'saw', 'hammer', 'screwdriver'] },
      
      // Gaming
      'gaming': { intent: 'gaming equipment rental', keywords: ['gaming', 'game'], categories: ['Electronics'], synonyms: ['video games', 'console'], relatedTerms: ['playstation', 'xbox', 'nintendo', 'pc gaming'] },
      'game': { intent: 'gaming equipment', keywords: ['game', 'gaming'], categories: ['Electronics'], synonyms: ['gaming', 'console'], relatedTerms: ['controller', 'headset', 'gaming chair'] },
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
    try {
      const prompt = `Analyze this search query for a rental marketplace: "${query}"

You must understand semantic meaning and context. Be smart about matching:
- "computer" should match MacBooks, laptops, PCs, gaming computers
- "cool stuff" should match trendy electronics, cameras, gaming gear, drones
- "awesome" should match high-end electronics, professional equipment
- Be creative with synonyms and related terms

Return JSON with:
- intent: What the user is really looking for (be specific and semantic)
- keywords: Key terms plus semantic matches
- categories: Likely rental categories (Tools, Electronics, Sports, Outdoor, Photography, Gaming, etc.)
- synonyms: Alternative words including brand names and specific models
- relatedTerms: Related items they might also want

Examples:
- "computer" → intent: "computing devices including laptops and desktops", keywords: ["computer", "laptop", "macbook", "pc"], categories: ["Electronics"], synonyms: ["laptop", "macbook", "desktop", "notebook", "gaming pc"], relatedTerms: ["macbook pro", "gaming laptop", "workstation", "tablet"]
- "cool stuff" → intent: "trendy and interesting rental items", keywords: ["cool", "awesome", "trendy"], categories: ["Electronics", "Photography", "Gaming"], synonyms: ["awesome", "amazing", "popular", "trendy"], relatedTerms: ["camera", "drone", "gaming gear", "macbook", "gadgets"]`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
      // Use smart fallback with enhanced semantic understanding
      console.log("Using smart fallback analysis for:", query);
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

      // Special semantic boost for high-value items when searching for "cool" or "awesome"
      const isHighValueQuery = searchAnalysis.intent.toLowerCase().includes('cool') || 
                              searchAnalysis.intent.toLowerCase().includes('awesome') ||
                              searchAnalysis.intent.toLowerCase().includes('trendy');
      
      if (isHighValueQuery) {
        // Boost electronics, gaming, photography items
        if (fullText.includes('macbook') || fullText.includes('camera') || 
            fullText.includes('gaming') || fullText.includes('drone') ||
            fullText.includes('pro') || fullText.includes('professional')) {
          score += 8;
          reasons.push('High-value tech item');
        }
      }

      // Computer query semantic matching
      const isComputerQuery = searchAnalysis.intent.toLowerCase().includes('computer') ||
                             searchAnalysis.intent.toLowerCase().includes('computing');
      
      if (isComputerQuery) {
        // Strong boost for laptops, MacBooks, PCs
        if (fullText.includes('macbook') || fullText.includes('laptop') || 
            fullText.includes('computer') || fullText.includes('pc')) {
          score += 12;
          reasons.push('Computing device match');
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

  private shouldTriggerAlternatives(query: string, relevantItems: any[]): boolean {
    const queryLower = query.toLowerCase();
    
    // Trigger alternatives for specific brand searches that return low-quality matches
    const specificBrands = ['bose', 'beats', 'sony', 'samsung', 'lg', 'microsoft', 'google'];
    const containsSpecificBrand = specificBrands.some(brand => queryLower.includes(brand));
    
    if (containsSpecificBrand) {
      // If we found results but none are high-scoring matches for the specific brand
      const hasHighQualityBrandMatch = relevantItems.some(item => {
        const itemText = `${item.title} ${item.description}`.toLowerCase();
        return specificBrands.some(brand => 
          queryLower.includes(brand) && itemText.includes(brand)
        );
      });
      return !hasHighQualityBrandMatch;
    }
    
    return false;
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
      .filter(item => item.score >= 8) // Higher threshold for direct matches
      .slice(0, 10)
      .map(match => {
        const originalItem = allItems.find(item => item.id === match.id);
        return {
          ...originalItem,
          aiScore: match.score,
          aiReason: match.reason
        };
      });

    // Check if we should show alternative suggestions
    // Show alternatives if no high-quality matches OR if query contains specific brand not found
    const shouldShowAlternatives = relevantItems.length === 0 || this.shouldTriggerAlternatives(query, relevantItems);
    
    if (shouldShowAlternatives) {
      const alternativeMatches = await this.findAlternativeSuggestions(query, allItems, searchAnalysis);
      console.log(`No exact matches for "${query}", suggesting ${alternativeMatches.length} alternatives`);
      return alternativeMatches.map(match => ({
        ...match,
        isAlternativeSuggestion: true,
        originalQuery: query
      }));
    }

    console.log(`AI Search found ${relevantItems.length} relevant items for "${query}"`);
    return relevantItems;
  }

  async findAlternativeSuggestions(originalQuery: string, allItems: any[], searchAnalysis: SearchAnalysis): Promise<any[]> {
    // Create broader search terms based on the query category
    const broadSearchTerms = this.getBroadSearchTerms(originalQuery, searchAnalysis);
    
    const suggestions: any[] = [];
    
    for (const broadTerm of broadSearchTerms) {
      const broadAnalysis = await this.analyzeSearchQuery(broadTerm);
      const scoredItems = await this.scoreItemRelevance(allItems, broadAnalysis);
      
      const matches = scoredItems
        .filter(item => item.score >= 2) // Lower threshold for suggestions
        .slice(0, 3)
        .map(match => {
          const originalItem = allItems.find(item => item.id === match.id);
          return {
            ...originalItem,
            aiScore: match.score,
            aiReason: match.reason,
            suggestionReason: `Similar to ${originalQuery}`
          };
        });
      
      suggestions.push(...matches);
    }
    
    // Remove duplicates and return top 4 suggestions
    const uniqueSuggestions = suggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    return uniqueSuggestions.slice(0, 4);
  }

  private getBroadSearchTerms(query: string, searchAnalysis: SearchAnalysis): string[] {
    const queryLower = query.toLowerCase();
    
    // Mapping specific brands/products to broader categories
    if (queryLower.includes('bose') && queryLower.includes('headphone')) {
      return ['headphones', 'wireless earbuds', 'audio equipment'];
    }
    if (queryLower.includes('airpods')) {
      return ['wireless earbuds', 'headphones', 'apple accessories'];
    }
    if (queryLower.includes('iphone')) {
      return ['smartphone', 'phone', 'mobile device'];
    }
    if (queryLower.includes('macbook')) {
      return ['laptop', 'computer', 'apple laptop'];
    }
    if (queryLower.includes('canon') && queryLower.includes('camera')) {
      return ['camera', 'photography equipment', 'dslr'];
    }
    if (queryLower.includes('nintendo')) {
      return ['gaming console', 'gaming', 'console'];
    }
    if (queryLower.includes('tesla')) {
      return ['electric car', 'vehicle', 'car'];
    }
    
    // Fallback to search analysis categories and synonyms
    return [
      ...searchAnalysis.categories.map(cat => cat.toLowerCase()),
      ...searchAnalysis.synonyms.slice(0, 2),
      ...searchAnalysis.relatedTerms.slice(0, 2)
    ].filter(term => term && term.length > 2);
  }
}

export const aiSearchService = new AISearchService();