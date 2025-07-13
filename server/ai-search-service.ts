import OpenAI from "openai";

// ChatGPT 3.5 for AI-powered search analysis
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SearchAnalysis {
  intent: string;
  keywords: string[];
  categories: string[];
  synonyms: string[];
  relatedTerms: string[];
  priceFilter?: 'low' | 'high'; // For price-based searches
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
      // Price-based searches
      'cheap': { intent: 'affordable low-cost rental items', keywords: ['cheap', 'affordable', 'budget'], categories: ['Tools', 'Sports', 'Outdoor'], synonyms: ['inexpensive', 'budget', 'affordable', 'low-cost'], relatedTerms: ['under $10', 'budget friendly', 'economical'], priceFilter: 'low' },
      'low cost': { intent: 'budget-friendly rental items', keywords: ['low', 'cost', 'cheap', 'affordable'], categories: ['Tools', 'Sports', 'Outdoor'], synonyms: ['cheap', 'budget', 'inexpensive', 'affordable'], relatedTerms: ['under $15', 'budget items', 'economical'], priceFilter: 'low' },
      'budget': { intent: 'budget-friendly rental options', keywords: ['budget', 'cheap', 'affordable'], categories: ['Tools', 'Sports', 'Outdoor'], synonyms: ['cheap', 'low-cost', 'economical'], relatedTerms: ['under $12', 'affordable', 'value'], priceFilter: 'low' },
      'expensive': { intent: 'premium high-end rental items', keywords: ['expensive', 'premium', 'high-end'], categories: ['Electronics', 'Photography'], synonyms: ['costly', 'high-end', 'premium', 'luxury'], relatedTerms: ['professional grade', 'premium equipment', 'high-value'], priceFilter: 'high' },
      'premium': { intent: 'high-end premium rental equipment', keywords: ['premium', 'expensive', 'luxury'], categories: ['Electronics', 'Photography'], synonyms: ['high-end', 'luxury', 'professional', 'costly'], relatedTerms: ['professional equipment', 'high-quality', 'top-tier'], priceFilter: 'high' },
      'luxury': { intent: 'luxury high-value rental items', keywords: ['luxury', 'premium', 'expensive'], categories: ['Electronics', 'Photography'], synonyms: ['high-end', 'premium', 'exclusive'], relatedTerms: ['professional grade', 'top quality', 'exclusive'], priceFilter: 'high' },
      
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
        return {
          intent: mapping.intent,
          keywords: mapping.keywords,
          categories: mapping.categories,
          synonyms: mapping.synonyms,
          relatedTerms: mapping.relatedTerms,
          priceFilter: mapping.priceFilter
        };
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
    // Start timer for 3-second timeout
    const timeout = new Promise<SearchAnalysis>((_, reject) => {
      setTimeout(() => {
        console.log(`⏰ AI search timeout after 3 seconds for query: "${query}"`);
        reject(new Error('AI search timeout'));
      }, 3000); // 3 second timeout
    });

    const aiAnalysis = async (): Promise<SearchAnalysis> => {
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

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a search analysis expert for a rental marketplace. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 500 // Limit response size for faster processing
        });

        const rawJson = response.choices[0].message.content;
        if (rawJson) {
          return JSON.parse(rawJson);
        } else {
          throw new Error("Empty response from AI");
        }
      } catch (error) {
        console.error('AI search analysis failed:', error);
        throw error;
      }
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

      // Price-based scoring boost
      if (searchAnalysis.priceFilter) {
        const price = parseFloat(item.price);
        if (searchAnalysis.priceFilter === 'low') {
          // Boost items under $15 for cheap/budget searches
          if (price <= 15) {
            score += 15;
            reasons.push(`Budget-friendly price: $${price}`);
          } else if (price <= 25) {
            score += 8;
            reasons.push(`Affordable price: $${price}`);
          }
        } else if (searchAnalysis.priceFilter === 'high') {
          // Boost items over $30 for expensive/premium searches
          if (price >= 30) {
            score += 15;
            reasons.push(`Premium price: $${price}`);
          } else if (price >= 20) {
            score += 8;
            reasons.push(`High-end price: $${price}`);
          }
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

    // For price-based searches, implement direct price filtering first
    if (searchAnalysis.priceFilter) {
      console.log(`Price-based search detected: ${searchAnalysis.priceFilter}`);
      
      let priceFilteredItems = allItems;
      if (searchAnalysis.priceFilter === 'low') {
        // For "cheap" searches, prioritize items under $15, then under $25
        priceFilteredItems = allItems
          .filter(item => parseFloat(item.price) <= 25)
          .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        console.log(`Found ${priceFilteredItems.length} budget-friendly items (under $25)`);
      } else if (searchAnalysis.priceFilter === 'high') {
        // For "expensive" searches, prioritize items over $20
        priceFilteredItems = allItems
          .filter(item => parseFloat(item.price) >= 20)
          .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        console.log(`Found ${priceFilteredItems.length} premium items (over $20)`);
      }
      
      // Return the price-filtered results directly for better performance
      if (priceFilteredItems.length > 0) {
        return priceFilteredItems.slice(0, 10).map(item => ({
          ...item,
          aiScore: 20,
          aiReason: `Price-based match: ${searchAnalysis.priceFilter === 'low' ? 'Budget-friendly' : 'Premium'} pricing`
        }));
      }
    }

    // Score items based on AI analysis
    const scoredItems = await this.scoreItemRelevance(allItems, searchAnalysis);
    
    // Adjust threshold for price-based searches (lower threshold for broader results)
    const threshold = searchAnalysis.priceFilter ? 5 : 8; // Lower threshold for price searches
    
    // Return top matches with scores above threshold
    let relevantItems = scoredItems
      .filter(item => item.score >= threshold)
      .slice(0, 10)
      .map(match => {
        const originalItem = allItems.find(item => item.id === match.id);
        return {
          ...originalItem,
          aiScore: match.score,
          aiReason: match.reason
        };
      });

    // Apply price-based sorting if this is a price-related search
    if (searchAnalysis.priceFilter) {
      if (searchAnalysis.priceFilter === 'low') {
        // For "cheap" or "low cost" searches, sort by price ascending (lowest first)
        relevantItems = relevantItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        console.log('Applied low-cost price sorting (cheapest first)');
      } else if (searchAnalysis.priceFilter === 'high') {
        // For "expensive" or "premium" searches, sort by price descending (highest first)
        relevantItems = relevantItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        console.log('Applied high-cost price sorting (most expensive first)');
      }
    }

    // Check if we should show alternative suggestions
    // Show alternatives if no high-quality matches OR if query contains specific brand not found
    const shouldShowAlternatives = relevantItems.length === 0 || this.shouldTriggerAlternatives(query, relevantItems);
    
    if (shouldShowAlternatives) {
      const alternativeMatches = await this.findAlternativeSuggestions(query, allItems, searchAnalysis);
      console.log(`No exact matches for "${query}", suggesting ${alternativeMatches.length} alternatives`);
      
      // Apply price sorting to alternatives as well
      let sortedAlternatives = alternativeMatches;
      if (searchAnalysis.priceFilter) {
        if (searchAnalysis.priceFilter === 'low') {
          sortedAlternatives = alternativeMatches.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (searchAnalysis.priceFilter === 'high') {
          sortedAlternatives = alternativeMatches.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        }
      }
      
      return sortedAlternatives.map(match => ({
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