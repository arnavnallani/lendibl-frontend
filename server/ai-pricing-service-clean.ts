import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Google Gemini AI pricing analysis
async function getGeminiPricing(prompt: string): Promise<any> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const enhancedPrompt = `You are a rental pricing expert. Analyze this item and suggest a competitive daily rental rate.

${prompt}

IMPORTANT: Pay close attention to any maximum price limits mentioned in the prompt above. If a maximum daily rate is specified, your suggested dailyRate MUST NOT exceed that amount under any circumstances.

Respond in this JSON format only:
{
  "dailyRate": <number - MUST respect any maximum limit mentioned above>,
  "reasoning": "<brief explanation>",
  "demandLevel": "low|medium|high",
  "seasonalTrend": "increasing|stable|decreasing",
  "competitivePosition": "below-market|market-rate|above-market"
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
        demandLevel: parsed.demandLevel,
        seasonalTrend: parsed.seasonalTrend,
        competitivePosition: parsed.competitivePosition,
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
      demandLevel: 'medium',
      seasonalTrend: 'stable',
      competitivePosition: 'market-rate',
      success: !!suggestedPrice
    };
  }
  
  return { success: false };
}

export class AIPricingService {
  async analyzePricing(input: PricingAnalysisInput): Promise<PricingSuggestion> {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const season = this.getCurrentSeason();
    
    // Estimate original item value to determine pricing constraints
    const estimatedValue = this.estimateItemValue(input.itemTitle, input.description, input.category);
    const maxAllowedPrice = estimatedValue <= 5000 ? 50 : Math.floor(estimatedValue * 0.15);
    
    const prompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. Condition: ${input.condition}.

CRITICAL PRICING CONSTRAINT: This item has an estimated original value of $${estimatedValue}. Since this is ${estimatedValue <= 5000 ? 'under $5000' : 'over $5000'}, you MUST suggest a daily rental rate that does NOT exceed $${maxAllowedPrice}. This is a hard maximum limit.

Consider market value, location, and ${season} seasonal demand for ${month}, but your suggested daily rate MUST be $${maxAllowedPrice} or less.`;
    
    try {
      const geminiResult = await getGeminiPricing(prompt);
      
      if (geminiResult.success && geminiResult.suggestedPrice) {
        // Enforce the pricing constraint
        const constrainedPrice = Math.min(geminiResult.suggestedPrice, maxAllowedPrice);
        const finalPrice = Math.max(5, Math.round(constrainedPrice * 100) / 100);
        
        const reasoning = [
          `Google Gemini AI: $${geminiResult.suggestedPrice}/day`,
          geminiResult.reasoning || `Optimized for ${input.location} market`,
          `${season} seasonal pricing for ${month}`,
          "Pure AI-powered pricing analysis"
        ];
        
        // Add constraint note if price was capped
        if (geminiResult.suggestedPrice > maxAllowedPrice) {
          reasoning.push(`Price capped at $${maxAllowedPrice} (max for items under $5000)`);
        }
        
        return {
          dailyRate: finalPrice,
          confidence: 0.95,
          reasoning,
          marketInsights: {
            demandLevel: geminiResult.demandLevel || 'medium',
            seasonalTrend: geminiResult.seasonalTrend || 'stable',
            competitivePosition: geminiResult.competitivePosition || 'market-rate'
          }
        };
      }
      
      throw new Error('Google Gemini AI did not provide valid pricing');
    } catch (error) {
      console.error('Google Gemini AI Error:', error);
      throw new Error('AI pricing service is currently unavailable. Please try again in a moment.');
    }
  }

  private estimateItemValue(title: string, description: string, category: string): number {
    const text = `${title} ${description}`.toLowerCase();
    
    // Simple value estimation with direct base values - no multipliers
    const valueIndicators = [
      // Tools & Equipment
      { keywords: ['dewalt', 'milwaukee', 'makita', 'bosch'], baseValue: 300 },
      { keywords: ['professional', 'commercial', 'industrial'], baseValue: 540 },
      { keywords: ['drill', 'saw', 'grinder'], baseValue: 180 },
      
      // Electronics - Direct realistic pricing
      { keywords: ['macbook pro 16'], baseValue: 2800 },
      { keywords: ['macbook pro 14'], baseValue: 1600 },
      { keywords: ['macbook pro'], baseValue: 2000 },
      { keywords: ['macbook air'], baseValue: 1200 },
      { keywords: ['macbook'], baseValue: 1500 },
      { keywords: ['gaming laptop'], baseValue: 1980 },
      { keywords: ['laptop', 'computer', 'desktop'], baseValue: 960 },
      { keywords: ['camera', 'dslr', 'mirrorless'], baseValue: 840 },
      { keywords: ['iphone', 'samsung', 'smartphone'], baseValue: 480 },
      
      // Vehicles & Transportation
      { keywords: ['tesla', 'bmw', 'mercedes'], baseValue: 75000 },
      { keywords: ['bike', 'bicycle', 'mountain'], baseValue: 650 },
      { keywords: ['motorcycle', 'scooter'], baseValue: 11200 },
      
      // Outdoor & Sports
      { keywords: ['kayak', 'canoe', 'boat'], baseValue: 1120 },
      { keywords: ['tent', 'camping'], baseValue: 240 },
      { keywords: ['snowboard', 'skis'], baseValue: 520 },
      
      // Home & Garden
      { keywords: ['pressure washer'], baseValue: 325 },
      { keywords: ['generator'], baseValue: 700 },
      { keywords: ['ladder'], baseValue: 180 }
    ];
    
    let estimatedValue = 100; // Default minimum
    
    for (const indicator of valueIndicators) {
      if (indicator.keywords.some(keyword => text.includes(keyword))) {
        estimatedValue = Math.max(estimatedValue, indicator.baseValue);
      }
    }
    
    return Math.round(estimatedValue);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }
}

export const aiPricingService = new AIPricingService();