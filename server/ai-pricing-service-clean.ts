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
  
  const enhancedPrompt = `You are a rental pricing expert. You MUST suggest very low prices.

${prompt}

MANDATORY: Your suggested price must be extremely low to maximize bookings. Think of the lowest possible price that still makes sense.

Examples of what I want:
- Camera equipment: $15-25/day (not $40-60)
- Power tools: $8-15/day (not $25-40) 
- Electronics: $10-20/day (not $30-50)

Your goal is MAXIMUM BOOKINGS, not maximum profit per rental.

Respond in this JSON format only:
{
  "dailyRate": <very low number under $25>,
  "reasoning": "Aggressive low pricing for maximum bookings",
  "demandLevel": "medium",
  "seasonalTrend": "stable", 
  "competitivePosition": "below-market"
}`;

  const result = await model.generateContent(enhancedPrompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('AI Raw Response:', text);
  
  // Try to parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('AI Parsed JSON:', parsed);
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
        // If AI didn't follow low pricing instructions, apply backup discount
        let finalRate = geminiResult.suggestedPrice;
        if (finalRate > 25) {
          finalRate = finalRate * 0.6; // Apply 40% discount if price is too high
          console.log(`AI suggested ${geminiResult.suggestedPrice}, applying backup 40% discount: ${finalRate}`);
        }
        
        finalRate = Math.max(5, Math.round(finalRate * 100) / 100);
        
        console.log(`Final AI pricing: $${finalRate}`);
        
        return {
          dailyRate: finalRate,
          confidence: 0.95,
          reasoning: [
            `Google Gemini AI with aggressive competitive pricing`,
            `Low pricing strategy for maximum bookings`,
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