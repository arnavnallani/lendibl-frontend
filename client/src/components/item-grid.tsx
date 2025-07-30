import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "./item-card";
import ItemListSimple from "./item-list-simple";
import { api } from "@/lib/api";
import { Link } from "wouter";
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
    sortBy: filters.sortBy,
    minRating: filters.minRating,
    availability: filters.availability,
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
    staleTime: 1 * 60 * 1000, // Cache for 1 minute to see filter changes quickly
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: (failureCount, error: any) => {
      // Special handling for database timeout errors
      if (error?.message?.includes('timeout') || error?.message?.includes('DB_TIMEOUT') || 
          error?.message?.includes('Database temporarily unavailable')) {
        return failureCount < 1; // Only retry once for DB issues
      }
      return failureCount < 2; // Normal retry for other errors
        },
    retryDelay: 2000, // 2 second delay between retries
    networkMode: 'online',
    // Disable any built-in timeouts
    meta: {
      noTimeout: true
    }
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllLoadedItems([]);
    setHasMore(true);
  }, [filters?.categoryId, filters?.search, filters?.priceRange, filters?.location, filters?.sortBy, filters?.minRating, filters?.availability]);

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

  // Get total count from pagination data instead of separate query
  const totalItemCount = paginatedData?.pagination?.total || 0;

  // Always call hooks - use enabled to control when they run
  const { data: allItemsData } = useQuery({
    queryKey: ["/api/items", { limit: 50 }], // Further reduced for performance
    queryFn: () => api.getItems({ limit: 50 }),
    enabled: !useAIResults && !regularLoading && items.length === 0, // Only fetch for alternative suggestions
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // No retries
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
    console.error('ItemGrid error:', error);
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4 font-medium">
            {error instanceof Error && error.message.includes('timeout') ? 
              'Loading took too long. Trying a faster approach...' :
              'Loading items failed. Refreshing...'
            }
          </p>
          <button 
            onClick={() => {
              // Force refresh by adding timestamp to bypass cache
              window.location.href = window.location.href.split('?')[0] + '?refresh=' + Date.now();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Now
          </button>
        </div>
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
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl border border-blue-200 shadow-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Be the first to list an item!
            </h3>
            <p className="text-gray-600 mb-6">
              Kickstart the marketplace with one of your awesome items...
            </p>
            <Link to="/list-item">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                List an Item
              </Button>
            </Link>
          </div>
        </div>
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
                `We've got ${totalItemCount} items available for rent`
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
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 overflow-hidden"
              onClick={() => onItemClick(item)}
            >
              <div className="flex gap-4 p-4">
                <div className="flex-shrink-0">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'}
                    alt={item.title}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate pr-4">{item.title}</h3>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${item.price || '0'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">per day</div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {item.city}, {item.state}
                      </span>

                    </div>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
