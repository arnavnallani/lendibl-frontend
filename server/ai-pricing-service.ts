import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const season = this.getCurrentSeason();
      
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
        model: "gpt-4o",
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
      
      // Fallback pricing based on simple heuristics using item category
      let estimatedCurrentValue = 100; // Default base value
      
      // Category-based value estimation
      const categoryLower = input.category.toLowerCase();
      if (categoryLower.includes('camera') || categoryLower.includes('photography')) {
        estimatedCurrentValue = 800;
      } else if (categoryLower.includes('tool') || categoryLower.includes('equipment')) {
        estimatedCurrentValue = 300;
      } else if (categoryLower.includes('electronic') || categoryLower.includes('computer')) {
        estimatedCurrentValue = 1000;
      } else if (categoryLower.includes('vehicle') || categoryLower.includes('car')) {
        estimatedCurrentValue = 15000;
      } else if (categoryLower.includes('outdoor') || categoryLower.includes('sport')) {
        estimatedCurrentValue = 200;
      }
      
      const dailyRate = Math.round((estimatedCurrentValue * 0.03) * 100) / 100; // 3% of estimated value per day
      
      return {
        dailyRate,
        confidence: 0.3,
        reasoning: [
          "AI pricing temporarily unavailable",
          "Using conservative market-rate pricing",
          "Based on estimated item depreciation"
        ],
        marketInsights: {
          demandLevel: 'medium',
          seasonalTrend: 'stable',
          competitivePosition: 'market-rate'
        }
      };
    }
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