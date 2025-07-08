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

async function getChatGPTPricingWithContext(currentPrice: number, input: PricingAnalysisInput): Promise<any> {
  const enhancedPrompt = `You are an expert rental marketplace pricing analyst with deep knowledge of consumer behavior, market dynamics, and rental economics. 

Your expertise includes:
- Analyzing market demand patterns across different item categories
- Understanding seasonal trends and local market variations  
- Evaluating competitive positioning and pricing strategies
- Assessing item depreciation and condition impact on rental value
- Identifying optimal price points for maximum revenue and booking rates

Consider the full spectrum of market factors and price accordingly - there are no artificial constraints on your pricing decisions, other than the pricing guidelines outlined below. Recommend whatever daily rate maximizes owner revenue while maintaining market competitiveness.

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

REMEMBER, THE PRICE SUGGESTION YOU GIVE CAN ONLY BE 3 DOLLARS ABOVE OR BELOW THE GUIDELINES THAT I PROVIDED ABOVE. NO MATTER WHAT MARKET ANALYSIS YOU DO IN THE NEXT STEPS, YOU CAN ONLY BE 3 DOLLARS ABOVE OR BELOW THE GUIDELINES THAT I PROVIDED ABOVE.

ITEM DETAILS FOR ANALYSIS:
- Title: ${input.itemTitle}
- Category: ${input.category}
- Description: ${input.description}
- Location: ${input.location}
- Condition: ${input.condition}
- Current market price: $${currentPrice}

IMPORTANT: You can use your own judgment as prompted above to adjust pricing based on market conditions, but you can ONLY influence the formula output by up to $3 above or below. The ±$3 range is your maximum adjustment limit.

Use the item details above to provide comprehensive market analysis. Consider the specific item type, local market conditions in ${input.location}, category-specific demand patterns, and seasonal factors relevant to ${input.category} items.

Provide comprehensive market analysis in your reasoning. Include multiple detailed points covering:
1. Market demand analysis for this item category
2. Seasonal factors affecting rental rates
3. Competitive positioning strategy
4. Revenue optimization insights
5. Consumer behavior patterns
6. Risk/reward assessment

REMEMBER, THE PRICE SUGGESTION YOU GIVE CAN ONLY BE 3 DOLLARS ABOVE OR BELOW THE GUIDELINES THAT I PROVIDED ABOVE. NO MATTER WHAT THE MARKET ANALYSIS IS, YOU CAN ONLY BE 3 DOLLARS ABOVE OR BELOW THE GUIDELINES THAT I PROVIDED ABOVE. PLEASE PLEASE PLEASE REMEMBER THIS AND FOLLOW THIS NO MATTER WHAT!!!!!!!!!!

Respond in this JSON format only:
{
  "dailyRate": <number>,
  "reasoning": [
    "Market demand analysis: [detailed analysis of current demand patterns for this item category]",
    "Seasonal factors: [detailed explanation of seasonal trends affecting pricing]", 
    "Competitive positioning: [detailed strategy for positioning against competitors]",
    "Revenue optimization: [detailed insights on maximizing owner revenue]",
    "Consumer behavior: [detailed analysis of renter behavior patterns for this item type]",
    "Risk assessment: [detailed evaluation of pricing risks and market dynamics]"
  ],
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
  
  // Log the raw ChatGPT response
  console.log('🤖 === RAW CHATGPT RESPONSE ===');
  console.log(text);
  console.log('🤖 === END RAW RESPONSE ===');
  
  // Try to parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suggestedPrice: parsed.dailyRate,
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [parsed.reasoning],
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
    
    // Log what price we're analyzing
    console.log('🤖 === AI PRICING ANALYSIS ===');
    console.log('Item Price:', originalPrice);
    console.log('Expected Range:', originalPrice >= 1000 ? 
      `Formula: 0.003(${originalPrice}) + 25 = $${Math.round((0.003 * originalPrice + 25) * 100) / 100} (±$3)` :
      `Tiered pricing for $${originalPrice} item`);
    console.log('🤖 === END ANALYSIS ===');
    
    try {
      const chatGPTResult = await getChatGPTPricingWithContext(originalPrice, input);
      
      // Log the AI's full response
      console.log('🤖 === AI RESPONSE ===');
      console.log('Suggested Price:', chatGPTResult.suggestedPrice);
      console.log('AI Reasoning:', chatGPTResult.reasoning);
      console.log('Demand Level:', chatGPTResult.demandLevel);
      console.log('Seasonal Trend:', chatGPTResult.seasonalTrend);
      console.log('Competitive Position:', chatGPTResult.competitivePosition);
      console.log('🤖 === END RESPONSE ===');
      
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
        
        // Use detailed AI reasoning if available, otherwise fallback to basic reasoning
        const reasoning = Array.isArray(chatGPTResult.reasoning) && chatGPTResult.reasoning.length > 1 
          ? chatGPTResult.reasoning
          : [
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