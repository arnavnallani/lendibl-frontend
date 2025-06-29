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

IMPORTANT: The maximum daily rental rate is $50. Never suggest a price above $50.

${prompt}

Respond in this JSON format only:
{
  "dailyRate": <number between 1 and 50>,
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
      // Enforce $50 maximum price limit
      const dailyRate = Math.min(parsed.dailyRate || 0, 50);
      return {
        suggestedPrice: dailyRate,
        reasoning: parsed.reasoning,
        demandLevel: parsed.demandLevel,
        seasonalTrend: parsed.seasonalTrend,
        competitivePosition: parsed.competitivePosition,
        success: !!(dailyRate && dailyRate > 0)
      };
    }
  } catch (parseError) {
    // Fallback: extract price from text
    const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    const extractedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
    // Enforce $50 maximum price limit
    const suggestedPrice = extractedPrice ? Math.min(extractedPrice, 50) : null;
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
    
    const prompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. Condition: ${input.condition}. What daily rental rate would you suggest? Consider market value, location, and ${season} seasonal demand for ${month}.`;
    
    try {
      const geminiResult = await getGeminiPricing(prompt);
      
      if (geminiResult.success && geminiResult.suggestedPrice) {
        // Enforce $50 maximum price limit with $5 minimum
        const constrainedPrice = Math.max(5, Math.min(50, Math.round(geminiResult.suggestedPrice * 100) / 100));
        return {
          dailyRate: constrainedPrice,
          confidence: 0.95,
          reasoning: [
            `Google Gemini AI: $${geminiResult.suggestedPrice}/day`,
            geminiResult.reasoning || `Optimized for ${input.location} market`,
            `${season} seasonal pricing for ${month}`,
            "Pure AI-powered pricing analysis"
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