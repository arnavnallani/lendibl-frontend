import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "./item-card";
import ItemList from "./item-list";
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
    minRating?: number;
    availability?: string;
    sortBy?: string;
  };
  aiResults?: EnhancedItem[];
  useAIResults?: boolean;
  aiLoading?: boolean;
  onItemClick: (item: ItemWithDetails) => void;
  viewMode?: 'grid' | 'list';
}

export default function ItemGrid({ filters, aiResults, useAIResults, aiLoading, onItemClick, viewMode = 'grid' }: ItemGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedItems, setAllLoadedItems] = useState<ItemWithDetails[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [preserveScrollPosition, setPreserveScrollPosition] = useState<number | null>(null);
  
  const queryFilters = filters ? {
    categoryId: filters.categoryId,
    search: filters.search,
    location: filters.location,
    page: currentPage,
    limit: 30,
    ...(filters.priceRange && filters.priceRange !== "all" ? {
      minPrice: filters.priceRange === "0-25" ? 0 : 
                filters.priceRange === "25-50" ? 25 :
                filters.priceRange === "50-100" ? 50 :
                filters.priceRange === "100+" ? 100 : undefined,
      maxPrice: filters.priceRange === "0-25" ? 25 : 
                filters.priceRange === "25-50" ? 50 :
                filters.priceRange === "50-100" ? 100 : undefined,
    } : {}),
  } : { page: currentPage, limit: 30 };

  const { data: paginatedData, isLoading: regularLoading, error } = useQuery({
    queryKey: ["/api/items", queryFilters],
    queryFn: () => api.getItems(queryFilters),
    enabled: !useAIResults, // Only fetch regular items when not using AI
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllLoadedItems([]);
    setHasMore(true);
  }, [filters?.categoryId, filters?.search, filters?.priceRange, filters?.location]);

  // Update items when new data is received
  useEffect(() => {
    if (paginatedData) {
      if (currentPage === 1) {
        setAllLoadedItems(paginatedData.items);
      } else {
        setAllLoadedItems(prev => [...prev, ...paginatedData.items]);
      }
      setHasMore(paginatedData.pagination.hasMore);
      setIsLoadingMore(false);
    }
  }, [paginatedData, currentPage]);

  // Restore scroll position after loading more items
  useEffect(() => {
    if (preserveScrollPosition !== null && !isLoadingMore && !regularLoading) {
      window.scrollTo(0, preserveScrollPosition);
      setPreserveScrollPosition(null);
    }
  }, [preserveScrollPosition, isLoadingMore, regularLoading]);

  // Use AI results or regular items based on flag
  const items: EnhancedItem[] = useAIResults ? (aiResults || []) : allLoadedItems;
  const isLoading = useAIResults ? aiLoading : regularLoading;

  // Get total count for display
  const { data: totalCountData } = useQuery({
    queryKey: ["/api/items", { ...queryFilters, limit: 1000 }],
    queryFn: () => api.getItems({ ...queryFilters, limit: 1000 }),
    enabled: !useAIResults,
  });
  const totalItemCount = totalCountData?.pagination?.total || totalCountData?.items?.length || 0;

  // Always call hooks - use enabled to control when they run
  const { data: allItemsData } = useQuery({
    queryKey: ["/api/items", { limit: 1000 }],
    queryFn: () => api.getItems({ limit: 1000 }),
    enabled: !useAIResults && !regularLoading && items.length === 0, // Only fetch for alternative suggestions
  });
  const allItems = allItemsData?.items || [];

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
    enabled: !useAIResults && !regularLoading, // Only fetch for alternative suggestions
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

  if (items.length === 0) {
    // Generate smart alternative suggestions
    const getSimilarItems = () => {
      if (!allItems.length) return [];
      
      let categoryName = "";
      let searchTerm = "";
      
      // Determine what the user was looking for
      if (filters?.categoryId) {
        const category = categories.find(c => c.id === filters.categoryId);
        categoryName = category?.name || "";
      }
      
      if (filters?.search) {
        searchTerm = filters.search;
      }

      // Define category relationships for better suggestions
      const categoryMapping: { [key: string]: string[] } = {
        "Sports Gear": ["Electronics", "Outdoor", "Vehicles"],
        "Tools & Equipment": ["Electronics", "Home & Garden", "Vehicles"],
        "Electronics": ["Gaming", "Tools & Equipment", "Sports Gear"],
        "Gaming": ["Electronics", "Sports Gear"],
        "Outdoor": ["Sports Gear", "Vehicles", "Tools & Equipment"],
        "Vehicles": ["Outdoor", "Sports Gear", "Tools & Equipment"],
        "Home & Garden": ["Tools & Equipment", "Electronics"],
        "Clothing": ["Sports Gear", "Outdoor"]
      };

      // Get similar categories
      const similarCategories = categoryMapping[categoryName] || [];
      
      // Filter items from similar categories or by search relevance
      let suggestedItems = allItems.filter(item => {
        if (categoryName && similarCategories.includes(item.category?.name || "")) {
          return true;
        }
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const itemText = `${item.title} ${item.description}`.toLowerCase();
          
          // Look for semantic matches
          if (searchLower.includes("sport") && 
              (itemText.includes("bike") || itemText.includes("gear") || itemText.includes("equipment"))) {
            return true;
          }
          
          if (searchLower.includes("gaming") && 
              (itemText.includes("electronic") || itemText.includes("computer") || itemText.includes("tech"))) {
            return true;
          }
          
          if (searchLower.includes("tool") && 
              (itemText.includes("drill") || itemText.includes("equipment") || itemText.includes("work"))) {
            return true;
          }
        }
        
        return false;
      });

      // If still no matches, show popular items from any category
      if (suggestedItems.length === 0) {
        suggestedItems = allItems.slice(0, 6);
      }
      
      return suggestedItems.slice(0, 6);
    };

    const suggestedItems = getSimilarItems();
    const queryText = filters?.search || (filters?.categoryId ? categories.find(c => c.id === filters?.categoryId)?.name : "items");

    if (suggestedItems.length > 0) {
      return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              We don't have "{queryText}" yet...
            </h3>
            <p className="text-gray-600 mb-4">
              But you may be interested in these similar items:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Similar items you might like
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {suggestedItems.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onClick={onItemClick}
              />
            ))}
          </div>
        </main>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-gray-medium text-lg mb-4">We don't have that yet...</p>
        <p className="text-gray-medium">New items can be added at any time though!</p>
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
                `Over ${totalItemCount} items available for rent`
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

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onClick={onItemClick}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center">List view temporarily disabled - debugging mode</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {!useAIResults && hasMore && (
        <div className="text-center mt-12">
          <Button 
            variant="outline"
            onClick={() => {
              setPreserveScrollPosition(window.scrollY);
              setIsLoadingMore(true);
              setCurrentPage(prev => prev + 1);
            }}
            disabled={regularLoading || isLoadingMore}
            className="px-8 py-3 bg-white border-2 border-gray-dark text-gray-dark font-medium rounded-full hover:bg-gray-dark hover:text-white transition-colors disabled:opacity-50"
          >
            {(regularLoading || isLoadingMore) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More Items"
            )}
          </Button>
        </div>
      )}
    </main>
  );
}
