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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
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
    
    const prompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. Condition: ${input.condition}.

PRICING RULES:
1. First estimate the original purchase price of this item
2. If original price is under $1000: Maximum daily rate is $35, but suggest slightly lower prices (aim for $25-32 range)
3. If original price is over $1000: Use formula y = 0.005x + 30 (with some market flexibility)

EXAMPLES:
- MacBook Pro 14-inch ($1600 original) → ~$38/day base
- Apple Vision Pro ($3500 original) → ~$47.50/day base  
- Basic drill ($120 original) → ~$20/day (aim lower for under $1000)
- Professional camera ($800 original) → ~$28/day (aim lower for under $1000)

Consider ${season} seasonal demand for ${month} and ${input.location} market conditions, but respect the pricing rules above.`;
    
    try {
      const geminiResult = await getGeminiPricing(prompt);
      
      if (geminiResult.success && geminiResult.suggestedPrice) {
        const finalPrice = Math.max(5, Math.round(geminiResult.suggestedPrice * 100) / 100);
        
        const reasoning = [
          `AI-powered pricing: $${geminiResult.suggestedPrice}/day`,
          geminiResult.reasoning || `Optimized for ${input.location} market`,
          `${season} seasonal pricing for ${month}`,
          "Natural AI understanding of item value"
        ];
        
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
    // Use category-based estimation with reasonable defaults
    const categoryDefaults: { [key: string]: number } = {
      'Electronics': 800,
      'Tools & Equipment': 200,
      'Outdoor & Sports': 300,
      'Vehicles & Transportation': 5000,
      'Home & Garden': 150,
      'Clothing & Accessories': 100,
      'Books & Media': 50,
      'Health & Beauty': 80
    };
    
    return categoryDefaults[category] || 200;
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