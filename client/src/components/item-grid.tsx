import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "./item-card";
import { api } from "@/lib/api";
import type { ItemWithDetails } from "@shared/schema";

interface EnhancedItem extends ItemWithDetails {
  isAlternativeSuggestion?: boolean;
  originalQuery?: string;
  aiScore?: number;
  aiReason?: string;
  suggestionReason?: string;
}

interface ItemGridProps {
  filters?: {
    categoryId?: number;
    search?: string;
    priceRange?: string;
    location?: string;
  };
  aiResults?: EnhancedItem[];
  useAIResults?: boolean;
  aiLoading?: boolean;
  onItemClick: (item: ItemWithDetails) => void;
}

export default function ItemGrid({ filters, aiResults, useAIResults, aiLoading, onItemClick }: ItemGridProps) {
  const queryFilters = filters ? {
    categoryId: filters.categoryId,
    search: filters.search,
    location: filters.location,
    ...(filters.priceRange && filters.priceRange !== "all" ? {
      minPrice: filters.priceRange === "0-25" ? 0 : 
                filters.priceRange === "25-50" ? 25 :
                filters.priceRange === "50-100" ? 50 :
                filters.priceRange === "100+" ? 100 : undefined,
      maxPrice: filters.priceRange === "0-25" ? 25 : 
                filters.priceRange === "25-50" ? 50 :
                filters.priceRange === "50-100" ? 100 : undefined,
    } : {}),
  } : undefined;

  const { data: regularItems = [], isLoading: regularLoading, error } = useQuery({
    queryKey: ["/api/items", queryFilters],
    queryFn: () => api.getItems(queryFilters),
    enabled: !useAIResults, // Only fetch regular items when not using AI
  });

  // Use AI results or regular items based on flag
  const items: EnhancedItem[] = useAIResults ? (aiResults || []) : regularItems;
  const isLoading = useAIResults ? aiLoading : regularLoading;

  // Fetch recommendations for empty state - always call to maintain hook order
  const { data: recommendationsData } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return res.json();
    },
    enabled: items.length === 0 && !isLoading, // Only fetch when no items found and not loading
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        {useAIResults && (
          <span className="ml-2 text-sm text-muted-foreground">AI analyzing your search...</span>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load items. Please try again.</p>
      </div>
    );
  }

  // Check if we have alternative suggestions (for searches with no direct matches)
  const firstItem = items[0] as EnhancedItem;
  const hasAlternatives = items.length > 0 && firstItem?.isAlternativeSuggestion;
  const originalQuery = hasAlternatives ? firstItem?.originalQuery : null;

  const recommendedItems = recommendationsData?.items || [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-medium text-lg mb-4">We don't have that yet...</p>
        {recommendedItems.length > 0 ? (
          <>
            <p className="text-gray-medium mb-8">But you may be interested in...</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {recommendedItems.slice(0, 6).map((item: ItemWithDetails) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-medium">New items can be added at any time though!</p>
        )}
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        {hasAlternatives ? (
          <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              We don't have "{originalQuery}" yet...
            </h3>
            <p className="text-gray-600 mb-4">
              But you may be interested in these similar items:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              AI-suggested alternatives
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-dark mb-2">
              {useAIResults ? "AI Search Results" : "Available Near You"}
            </h3>
            <p className="text-gray-medium">
              {useAIResults ? 
                `Found ${items.length} items matching your search with AI analysis` :
                `Over ${items.length} items available for rent`
              }
            </p>
            {useAIResults && items.length > 0 && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                AI-powered semantic search
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <ItemCard 
            key={item.id} 
            item={item} 
            onClick={onItemClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-12">
        <Button 
          variant="outline"
          className="px-8 py-3 bg-white border-2 border-gray-dark text-gray-dark font-medium rounded-full hover:bg-gray-dark hover:text-white transition-colors"
        >
          Load More Items
        </Button>
      </div>
    </main>
  );
}
