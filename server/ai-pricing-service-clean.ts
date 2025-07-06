import OpenAI from "openai";

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
  currentPrice?: number; // Current market value provided by user
}

// OpenAI ChatGPT 3.5 pricing analysis
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getChatGPTPricing(prompt: string): Promise<any> {
  const enhancedPrompt = `${prompt}

Use these pricing guidelines:

Items $1000 to $5000 should be either $3 above or below the formula output: 0.003(real price of item) + 25

For items under $1000:
$50 items - $3 above or below $5
$100 items - $3 above or below $8
$200 items - $3 above or below $10
$300 items - $3 above or below $12
$400 items - $3 above or below $14
$500 items - $3 above or below $16
$600 items - $3 above or below $19
$700 items - $3 above or below $22
$800 items - $3 above or below $24
$900 items - $3 above or below $26

Respond in this JSON format only:
{
  "dailyRate": <number>,
  "reasoning": "<brief explanation>",
  "demandLevel": "low|medium|high",
  "seasonalTrend": "increasing|stable|decreasing",
  "competitivePosition": "below-market|market-rate|above-market"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a rental pricing expert. Always respond with valid JSON only."
      },
      {
        role: "user",
        content: enhancedPrompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const text = response.choices[0].message.content || "";
  
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
    
    // Use provided current price or estimate if not provided
    const originalPrice = input.currentPrice || this.estimateItemValue(input.itemTitle, input.description, input.category);
    
    const prompt = `Analyze rental pricing for: ${input.itemTitle} in ${input.category} category, located in ${input.location}. Description: ${input.description}. Condition: ${input.condition}.

IMPORTANT: The current real market price of this item is $${originalPrice}.

PRICING RULES:
1. Use the provided current price: $${originalPrice}
2. If current price is under $1000: Maximum daily rate is $25, aim for $15-20/day to be very competitive and affordable
3. If current price is over $1000: Use formula y = 0.003x + 25

EXAMPLES BASED ON PROVIDED PRICE:
- Current price $${originalPrice} ${originalPrice < 1000 ? `(under $1000) → suggest rate between $15-25/day, preferably $15-20/day` : `(over $1000) → suggest around $${Math.round((0.003 * originalPrice + 25) * 100) / 100}/day base`}

IMPORTANT: Always err on the side of LOWER prices to make items more accessible and competitive.

Consider ${season} seasonal demand for ${month} and ${input.location} market conditions, but respect the pricing rules above.`;
    
    try {
      const chatGPTResult = await getChatGPTPricing(prompt);
      
      if (chatGPTResult.success && chatGPTResult.suggestedPrice) {
        // Apply lower pricing constraints
        let suggestedPrice = chatGPTResult.suggestedPrice;
        
        // Enforce maximum limits based on original price
        if (originalPrice < 1000) {
          suggestedPrice = Math.min(suggestedPrice, 25); // Max $25 for items under $1000
        } else {
          // For items over $1000, use formula: 0.003x + 25
          const formulaMax = (0.003 * originalPrice) + 25;
          suggestedPrice = Math.min(suggestedPrice, formulaMax);
        }
        
        const finalPrice = Math.max(5, Math.round(suggestedPrice * 100) / 100);
        
        const reasoning = [
          `AI-powered pricing: $${chatGPTResult.suggestedPrice}/day`,
          chatGPTResult.reasoning || `Optimized for ${input.location} market`,
          `${season} seasonal pricing for ${month}`,
          input.currentPrice ? `Based on provided real price: $${originalPrice}` : "AI estimated item value"
        ];
        
        return {
          dailyRate: finalPrice,
          confidence: 0.95,
          reasoning,
          marketInsights: {
            demandLevel: chatGPTResult.demandLevel || 'medium',
            seasonalTrend: chatGPTResult.seasonalTrend || 'stable',
            competitivePosition: chatGPTResult.competitivePosition || 'market-rate'
          }
        };
      }
      
      throw new Error('ChatGPT AI did not provide valid pricing');
    } catch (error) {
      console.error('ChatGPT AI Error:', error);
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