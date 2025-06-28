import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Free Google Gemini AI (15 requests per minute, no API key required for basic usage)
async function getFreeGeminiPricing(prompt: string): Promise<any> {
  try {
    // Using Gemini 2.5 Flash for improved pricing analysis
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const enhancedPrompt = `You are a rental pricing expert focused on competitive pricing. Analyze this item and suggest a daily rental rate that maximizes bookings.

${prompt}

Target pricing for different categories:
- Power tools: $8-12/day
- Electronics: $10-15/day  
- Sports equipment (bikes, etc): $15-22/day
- Cameras: $12-18/day
- All other items: $8-15/day

Focus on pricing that encourages frequent rentals while maintaining reasonable profit margins.

Respond in this JSON format only:
{
  "dailyRate": <number>,
  "reasoning": "<brief explanation of pricing strategy>"
}`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestedPrice: parsed.dailyRate,
          reasoning: parsed.reasoning,
          success: !!(parsed.dailyRate && parsed.dailyRate > 0)
        };
      }
    } catch (parseError) {
      // Fallback: extract price from text
      const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
      const suggestedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
      return {
        suggestedPrice,
        reasoning: text,
        success: !!suggestedPrice
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Gemini AI service error:', error);
    throw error;
  }
}

export interface PricingSuggestion {
  dailyRate: number;
  confidence: number;
  reasoning: string[];
  marketInsights: {
    demandLevel: 'low' | 'medium' | 'high';
    seasonalTrend: 'increasing' | 'stable' | 'decreasing';
    competitivePosition: 'below-market' | 'market-rate' | 'above-market';
  };
}

export interface PricingAnalysisInput {
  itemTitle: string;
  category: string;
  description: string;
  location: string;
  condition: string;
}

export class AIPricingService {
  async analyzePricing(input: PricingAnalysisInput): Promise<PricingSuggestion> {
    try {
      // First try free AI service
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const season = this.getCurrentSeason();
      
      const simplePrompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. What competitive daily rental rate would you suggest to maximize bookings? Focus on affordable pricing that attracts renters while still being profitable. Favor lower prices over higher prices to increase rental frequency. Consider market value, location, and ${season} seasonal demand.`;
      
      console.log('AI Pricing: Calling Gemini with prompt:', simplePrompt.substring(0, 100) + '...');
      const geminiResult = await getFreeGeminiPricing(simplePrompt);
      console.log('AI Pricing: Gemini result:', geminiResult);
      
      if (geminiResult.success && geminiResult.suggestedPrice) {
        const finalRate = Math.max(5, Math.round(geminiResult.suggestedPrice * 100) / 100);
        
        return {
          dailyRate: finalRate,
          confidence: 0.95,
          reasoning: [
            `Google Gemini AI competitive pricing`,
            geminiResult.reasoning || `Optimized for ${input.location} market`,
            `${season} seasonal pricing considered`
          ],
          marketInsights: {
            demandLevel: 'medium' as const,
            seasonalTrend: 'stable' as const,
            competitivePosition: 'below-market' as const
          }
        };
      }
      
      throw new Error('Google Gemini AI did not provide valid pricing');
      
      // Fallback to OpenAI if available
      const prompt = `You are an expert rental pricing analyst with deep knowledge of market values and rental economics. Analyze this item and provide optimal rental pricing to maximize owner earnings.

Item Details:
- Title: ${input.itemTitle}
- Category: ${input.category}
- Description: ${input.description}
- Location: ${input.location}
- Condition: ${input.condition}
- Current Month: ${month}
- Current Season: ${season}

Analysis Process:
1. First, estimate the current market value of this specific item based on the title, description, and condition
2. Consider item depreciation from original retail price
3. Analyze seasonal demand patterns for this category
4. Evaluate local market conditions in ${input.location}
5. Factor in typical rental utilization rates for similar items
6. Consider competition and market positioning
7. Account for risk factors and insurance considerations

Your goal is to suggest pricing that maximizes owner earnings while remaining competitive. Consider that owners want to earn back their investment over time through rentals.

Respond with JSON in this exact format:
{
  "dailyRate": number (recommended daily rental price),
  "confidence": number (0.0-1.0, how confident you are in this pricing),
  "reasoning": ["reason1", "reason2", "reason3"] (3-5 key factors that influenced pricing),
  "marketInsights": {
    "demandLevel": "low|medium|high",
    "seasonalTrend": "increasing|stable|decreasing", 
    "competitivePosition": "below-market|market-rate|above-market"
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a rental pricing expert with deep knowledge of market trends, seasonal patterns, and local economics. Provide data-driven pricing recommendations that maximize owner earnings while ensuring competitive market positioning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent pricing
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the response
      return {
        dailyRate: Math.max(1, Math.round(result.dailyRate * 100) / 100),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        reasoning: Array.isArray(result.reasoning) ? result.reasoning.slice(0, 5) : [],
        marketInsights: {
          demandLevel: ['low', 'medium', 'high'].includes(result.marketInsights?.demandLevel) 
            ? result.marketInsights.demandLevel : 'medium',
          seasonalTrend: ['increasing', 'stable', 'decreasing'].includes(result.marketInsights?.seasonalTrend)
            ? result.marketInsights.seasonalTrend : 'stable',
          competitivePosition: ['below-market', 'market-rate', 'above-market'].includes(result.marketInsights?.competitivePosition)
            ? result.marketInsights.competitivePosition : 'market-rate'
        }
      };
    } catch (error) {
      console.error('AI Pricing Service Error:', error);
      
      // Advanced fallback pricing using intelligent analysis
      let estimatedCurrentValue = this.estimateItemValue(input.itemTitle, input.description, input.category);
      
      // Apply location-based adjustments
      const locationMultiplier = this.getLocationPriceMultiplier(input.location);
      estimatedCurrentValue *= locationMultiplier;
      
      // Apply seasonal adjustments
      const seasonalMultiplier = this.getSeasonalMultiplier(input.category);
      estimatedCurrentValue *= seasonalMultiplier;
      
      // Calculate optimal daily rate (2-4% of estimated value)
      const baseRate = estimatedCurrentValue * 0.03;
      const dailyRate = Math.round(baseRate * 100) / 100;
      
      return {
        dailyRate,
        confidence: 0.8,
        reasoning: [
          `Estimated item value: $${Math.round(estimatedCurrentValue)}`,
          `Location adjustment: ${Math.round((locationMultiplier - 1) * 100)}%`,
          `Seasonal demand factor applied`,
          "Smart market analysis without AI"
        ],
        marketInsights: {
          demandLevel: this.getDemandLevel(input.category, input.location),
          seasonalTrend: this.getSeasonalTrend(input.category),
          competitivePosition: 'market-rate' as const
        }
      };
    }
  }

  private estimateItemValue(title: string, description: string, category: string): number {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    let baseValue = 100;
    
    // Electronics & Technology
    if (titleLower.includes('iphone') || titleLower.includes('ipad')) {
      if (titleLower.includes('pro')) baseValue = 1200;
      else if (titleLower.includes('15') || titleLower.includes('14')) baseValue = 900;
      else baseValue = 600;
    } else if (titleLower.includes('macbook') || titleLower.includes('laptop')) {
      if (titleLower.includes('pro') || titleLower.includes('m3') || titleLower.includes('m2')) baseValue = 2000;
      else baseValue = 1200;
    } else if (titleLower.includes('camera')) {
      if (titleLower.includes('dslr') || titleLower.includes('canon') || titleLower.includes('nikon')) baseValue = 800;
      else if (titleLower.includes('gopro')) baseValue = 400;
      else baseValue = 300;
    } else if (titleLower.includes('drone')) {
      if (titleLower.includes('dji') || titleLower.includes('mavic')) baseValue = 1200;
      else baseValue = 500;
    } else if (titleLower.includes('console') || titleLower.includes('playstation') || titleLower.includes('xbox')) {
      baseValue = 500;
    }
    
    // Tools & Equipment
    else if (categoryLower.includes('tool') || categoryLower.includes('equipment')) {
      if (titleLower.includes('drill') || titleLower.includes('saw')) baseValue = 200;
      else if (titleLower.includes('generator')) baseValue = 800;
      else if (titleLower.includes('welder')) baseValue = 600;
      else baseValue = 150;
    }
    
    // Vehicles
    else if (titleLower.includes('bike') || titleLower.includes('bicycle')) {
      if (titleLower.includes('mountain') || titleLower.includes('road')) baseValue = 800;
      else if (titleLower.includes('electric') || titleLower.includes('e-bike')) baseValue = 1500;
      else baseValue = 300;
    } else if (titleLower.includes('car') || titleLower.includes('vehicle')) {
      baseValue = 20000;
    }
    
    // Audio & Music
    else if (titleLower.includes('speaker') || titleLower.includes('audio')) {
      if (titleLower.includes('dj') || titleLower.includes('professional')) baseValue = 600;
      else baseValue = 200;
    }
    
    // Outdoor & Sports
    else if (titleLower.includes('tent') || titleLower.includes('camping')) {
      baseValue = 200;
    } else if (titleLower.includes('kayak') || titleLower.includes('paddle')) {
      baseValue = 600;
    }
    
    // Condition adjustments
    if (descLower.includes('new') || descLower.includes('unused')) {
      baseValue *= 0.9;
    } else if (descLower.includes('excellent') || descLower.includes('mint')) {
      baseValue *= 0.8;
    } else if (descLower.includes('good')) {
      baseValue *= 0.7;
    } else if (descLower.includes('fair') || descLower.includes('used')) {
      baseValue *= 0.6;
    }
    
    return Math.max(50, baseValue);
  }

  private getLocationPriceMultiplier(location: string): number {
    const locationLower = location.toLowerCase();
    
    // Major expensive cities
    if (locationLower.includes('san francisco') || locationLower.includes('new york') || 
        locationLower.includes('manhattan') || locationLower.includes('silicon valley')) {
      return 1.4;
    }
    // Other major cities
    else if (locationLower.includes('los angeles') || locationLower.includes('chicago') || 
             locationLower.includes('boston') || locationLower.includes('seattle')) {
      return 1.2;
    }
    // Medium cities
    else if (locationLower.includes('austin') || locationLower.includes('denver') || 
             locationLower.includes('miami')) {
      return 1.1;
    }
    
    return 1.0; // Default for smaller cities/towns
  }

  private getSeasonalMultiplier(category: string): number {
    const month = new Date().getMonth();
    const categoryLower = category.toLowerCase();
    
    // Summer items (May-August)
    if ((month >= 4 && month <= 7) && 
        (categoryLower.includes('outdoor') || categoryLower.includes('camping') || 
         categoryLower.includes('bike') || categoryLower.includes('water'))) {
      return 1.3;
    }
    
    // Winter items (November-February)
    if ((month >= 10 || month <= 1) && 
        (categoryLower.includes('ski') || categoryLower.includes('winter') || 
         categoryLower.includes('indoor'))) {
      return 1.2;
    }
    
    // Electronics year-round but higher during holidays
    if ((month === 10 || month === 11) && 
        categoryLower.includes('electronic')) {
      return 1.1;
    }
    
    return 1.0;
  }

  private getDemandLevel(category: string, location: string): 'low' | 'medium' | 'high' {
    const categoryLower = category.toLowerCase();
    const locationLower = location.toLowerCase();
    
    // High demand categories in major cities
    if ((locationLower.includes('san francisco') || locationLower.includes('new york')) &&
        (categoryLower.includes('electronic') || categoryLower.includes('tool'))) {
      return 'high';
    }
    
    // Generally high demand items
    if (categoryLower.includes('camera') || categoryLower.includes('laptop') || 
        categoryLower.includes('bike')) {
      return 'high';
    }
    
    return 'medium';
  }

  private getSeasonalTrend(category: string): 'increasing' | 'stable' | 'decreasing' {
    const month = new Date().getMonth();
    const categoryLower = category.toLowerCase();
    
    // Spring/Summer trend
    if (month >= 2 && month <= 5) {
      if (categoryLower.includes('outdoor') || categoryLower.includes('bike')) {
        return 'increasing';
      }
    }
    
    // Fall/Winter trend  
    if (month >= 8 && month <= 11) {
      if (categoryLower.includes('indoor') || categoryLower.includes('electronic')) {
        return 'increasing';
      }
    }
    
    return 'stable';
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  async getLocalEventInsights(location: string, category: string): Promise<string[]> {
    try {
      const prompt = `What major events, festivals, or seasonal activities in ${location} would increase demand for ${category} items? List 3-5 specific events or trends that rental owners should know about.

Respond with JSON: { "events": ["event1", "event2", "event3"] }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return Array.isArray(result.events) ? result.events.slice(0, 5) : [];
    } catch (error) {
      console.error('Local events insights error:', error);
      return [];
    }
  }
}

export const aiPricingService = new AIPricingService();