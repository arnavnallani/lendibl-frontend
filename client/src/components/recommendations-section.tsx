import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import ItemCard from './item-card';
import PreferencesModal from './preferences-modal';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, TrendingUp, User, Settings } from 'lucide-react';
import type { ItemWithDetails } from '@shared/schema';

interface RecommendationScore {
  itemId: number;
  score: number;
  reasons: string[];
}

interface RecommendationResult {
  items: ItemWithDetails[];
  scores: RecommendationScore[];
}

interface RecommendationsSectionProps {
  onItemClick: (item: ItemWithDetails) => void;
}

export default function RecommendationsSection({ onItemClick }: RecommendationsSectionProps) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['/api/recommendations', refreshKey],
    queryFn: (): Promise<RecommendationResult> => api.getRecommendations(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sign in to see personalized item recommendations based on your preferences.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations?.items.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error ? 'Unable to load recommendations.' : 'No recommendations available yet. Browse and interact with items to get personalized suggestions.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommended for You
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreferencesModalOpen(true)}
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Preferences</span>
              <span className="sm:hidden">Prefs</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.items.map((item, index) => {
            const score = recommendations.scores[index];
            return (
              <div key={item.id} className="relative">
                <ItemCard item={item} onClick={onItemClick} />
                {score && score.reasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {score.reasons.slice(0, 2).map((reason, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                    {score.reasons.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{score.reasons.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />
    </Card>
  );
}