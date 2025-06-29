import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Minus, DollarSign, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PricingSuggestion {
  dailyRate: number;
  confidence: number;
  reasoning: string[];
  marketInsights: {
    demandLevel: 'low' | 'medium' | 'high';
    seasonalTrend: 'increasing' | 'stable' | 'decreasing';
    competitivePosition: 'below-market' | 'market-rate' | 'above-market';
  };
}

interface AIPricingSuggestionsProps {
  itemTitle: string;
  category: string;
  description: string;
  location: string;
  condition?: string;
  onPriceSelect: (price: number) => void;
}

export function AIPricingSuggestions({
  itemTitle,
  category,
  description,
  location,
  condition = 'good',
  onPriceSelect
}: AIPricingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PricingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const { toast } = useToast();

  const fetchPricingSuggestions = async () => {
    if (!itemTitle || !category || !description || !location) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/pricing-suggestions", {
        itemTitle,
        category,
        description,
        location,
        condition
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      toast({
        title: "AI Pricing Unavailable",
        description: "Unable to generate pricing suggestions at the moment. Please set your own price.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDemandIcon = (level: string) => {
    switch (level) {
      case 'high': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'low': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSeasonalIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'above-market': return 'bg-green-100 text-green-800 border-green-200';
      case 'below-market': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!showSuggestions && !loading) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Smart Pricing</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get optimal pricing suggestions based on market demand, seasonality, and local events
              </p>
              <Button 
                onClick={fetchPricingSuggestions}
                disabled={loading || !itemTitle || !category || !description}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Smart Pricing Suggestions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Analyzing market data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span>Google Gemini AI Pricing</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {Math.round(suggestions.confidence * 100)}% confidence
          </Badge>
        </CardTitle>
        <CardDescription>
          Pure AI-powered pricing analysis using Google's Gemini AI for optimal rental rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Suggested Daily Rate */}
        <div className="flex justify-center">
          <div className="p-6 bg-white rounded-lg border-2 border-blue-200 max-w-xs">
            <div className="text-center">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">AI Recommended Daily Rate</p>
              <p className="text-3xl font-bold text-gray-900">${suggestions.dailyRate}</p>
              <p className="text-xs text-gray-500 mt-1">Based on market analysis</p>
            </div>
          </div>
        </div>

        {/* Manual Price Override */}
        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter rental price per day ($)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder={suggestions.dailyRate.toString()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value > 0) {
                onPriceSelect(value);
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Modify the AI suggestion or use your own price
          </p>
        </div>

        {/* Market Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            {getDemandIcon(suggestions.marketInsights.demandLevel)}
            <div>
              <p className="text-sm font-medium text-gray-900">Market Demand</p>
              <Badge className={getDemandColor(suggestions.marketInsights.demandLevel)}>
                {suggestions.marketInsights.demandLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getSeasonalIcon(suggestions.marketInsights.seasonalTrend)}
            <div>
              <p className="text-sm font-medium text-gray-900">Seasonal Trend</p>
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                {suggestions.marketInsights.seasonalTrend.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <DollarSign className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Price Position</p>
              <Badge className={getPositionColor(suggestions.marketInsights.competitivePosition)}>
                {suggestions.marketInsights.competitivePosition.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Why this pricing?</h4>
          <ul className="space-y-2">
            {suggestions.reasoning.map((reason, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-600">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => setShowSuggestions(false)}
          variant="outline"
          className="w-full"
        >
          Get New Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}