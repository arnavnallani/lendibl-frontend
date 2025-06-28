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
  
  const enhancedPrompt = `You are a rental pricing expert. Your goal is to suggest VERY LOW prices to maximize bookings.

Analyze this item: ${prompt}

CRITICAL INSTRUCTION: Whatever price you think is fair, multiply it by 0.6 (which means subtract 40%). This aggressive discount strategy maximizes rental bookings.

Examples:
- If you think $50/day is fair → suggest $30/day (50 × 0.6)
- If you think $100/day is fair → suggest $60/day (100 × 0.6)
- If you think $25/day is fair → suggest $15/day (25 × 0.6)

DO NOT suggest the full market price. Always apply the 60% multiplier (40% discount).

Respond in this JSON format only:
{
  "dailyRate": <number (market price × 0.6)>,
  "reasoning": "Market rate would be $X, but applying 40% discount for competitive pricing: $Y",
  "demandLevel": "medium",
  "seasonalTrend": "stable",
  "competitivePosition": "below-market"
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
    
    const prompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. Condition: ${input.condition}. What competitive daily rental rate would you suggest to maximize bookings? Focus on affordable pricing that attracts renters while still being profitable. Favor lower prices over higher prices to increase rental frequency. Consider market value, location, and ${season} seasonal demand for ${month}.`;
    
    try {
      const geminiResult = await getGeminiPricing(prompt);
      
      if (geminiResult.success && geminiResult.suggestedPrice) {
        const finalRate = Math.max(5, Math.round(geminiResult.suggestedPrice * 100) / 100);
        
        console.log(`AI Pricing with built-in 40% discount: $${finalRate}`);
        
        return {
          dailyRate: finalRate,
          confidence: 0.95,
          reasoning: [
            `Google Gemini AI with competitive pricing strategy`,
            geminiResult.reasoning || `40% below market rate for maximum bookings`,
            `Optimized for ${input.location} market`,
            `${season} seasonal pricing for ${month}`
          ],
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

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }
}

export const aiPricingService = new AIPricingService();