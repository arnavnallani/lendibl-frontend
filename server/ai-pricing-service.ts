import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PricingSuggestion {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
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
  originalPrice: number;
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
      
      const prompt = `You are an expert rental pricing analyst. Analyze this item and provide optimal rental pricing to maximize owner earnings.

Item Details:
- Title: ${input.itemTitle}
- Category: ${input.category}
- Original Purchase Price: $${input.originalPrice}
- Description: ${input.description}
- Location: ${input.location}
- Condition: ${input.condition}
- Current Month: ${month}
- Current Season: ${season}

Consider these factors:
1. Item depreciation and current market value
2. Seasonal demand patterns for this category
3. Local market conditions in ${input.location}
4. Typical rental utilization rates for similar items
5. Competition and market positioning
6. Risk factors and insurance considerations

Provide pricing recommendations that balance competitive rates with maximum earnings. Consider that owners want to earn back their investment over time while staying competitive.

Respond with JSON in this exact format:
{
  "dailyRate": number (recommended daily rental price),
  "weeklyRate": number (recommended weekly price with discount),
  "monthlyRate": number (recommended monthly price with larger discount),
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
        weeklyRate: Math.max(1, Math.round(result.weeklyRate * 100) / 100),
        monthlyRate: Math.max(1, Math.round(result.monthlyRate * 100) / 100),
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
      
      // Fallback pricing based on simple heuristics
      const estimatedCurrentValue = input.originalPrice * 0.7; // Assume 30% depreciation
      const dailyRate = Math.round((estimatedCurrentValue * 0.05) * 100) / 100; // 5% of current value per day
      
      return {
        dailyRate,
        weeklyRate: Math.round(dailyRate * 6 * 100) / 100, // 15% weekly discount
        monthlyRate: Math.round(dailyRate * 20 * 100) / 100, // 33% monthly discount
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