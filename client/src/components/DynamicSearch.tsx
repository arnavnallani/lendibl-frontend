import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Clock, TrendingUp, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchSuggestion {
  id: string;
  type: 'item' | 'category' | 'location' | 'recent' | 'trending';
  text: string;
  subtitle?: string;
  count?: number;
}

interface DynamicSearchProps {
  value: string;
  onChange: (value: string) => void;
  onLocationChange?: (location: string) => void;
  placeholder?: string;
  className?: string;
}

export function DynamicSearch({ 
  value, 
  onChange, 
  onLocationChange,
  placeholder = "Search for items...",
  className = ""
}: DynamicSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedValue = useDebounce(value, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lendibl-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((search: string) => {
    if (!search.trim() || search.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search);
      const updated = [search, ...filtered].slice(0, 5);
      localStorage.setItem('lendibl-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['/api/search-suggestions', debouncedValue],
    queryFn: async () => {
      if (!debouncedValue.trim()) return [];
      
      const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(debouncedValue)}`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: debouncedValue.length >= 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate suggestions based on input
  const getSuggestions = useCallback((): SearchSuggestion[] => {
    const results: SearchSuggestion[] = [];
    
    if (!value.trim()) {
      // Show recent searches when no input
      recentSearches.forEach((search, index) => {
        results.push({
          id: `recent-${index}`,
          type: 'recent',
          text: search
        });
      });
      
      // Add trending items
      const trending = ['Camera', 'Drill', 'Bike', 'Ladder', 'Generator'];
      trending.forEach((item, index) => {
        results.push({
          id: `trending-${index}`,
          type: 'trending',
          text: item,
          subtitle: 'Trending now'
        });
      });
    } else {
      // Add API suggestions
      suggestions.forEach((suggestion: any, index: number) => {
        results.push({
          id: `api-${index}`,
          type: suggestion.type || 'item',
          text: suggestion.text,
          subtitle: suggestion.subtitle,
          count: suggestion.count
        });
      });
      
      // Add smart completions
      const smartSuggestions = generateSmartSuggestions(value);
      smartSuggestions.forEach((suggestion, index) => {
        results.push({
          id: `smart-${index}`,
          ...suggestion
        });
      });
    }
    
    return results.slice(0, 8);
  }, [value, recentSearches, suggestions]);

  // Generate smart suggestions based on partial input
  const generateSmartSuggestions = (input: string): Omit<SearchSuggestion, 'id'>[] => {
    const suggestions: Omit<SearchSuggestion, 'id'>[] = [];
    const lower = input.toLowerCase();
    
    // Common items and categories
    const items = [
      { text: 'Camera', category: 'Electronics' },
      { text: 'Power Drill', category: 'Tools' },
      { text: 'Mountain Bike', category: 'Sports' },
      { text: 'Ladder', category: 'Tools' },
      { text: 'Generator', category: 'Equipment' },
      { text: 'Projector', category: 'Electronics' },
      { text: 'Tent', category: 'Outdoor' },
      { text: 'Pressure Washer', category: 'Equipment' }
    ];
    
    items.forEach(item => {
      if (item.text.toLowerCase().includes(lower)) {
        suggestions.push({
          type: 'item',
          text: item.text,
          subtitle: item.category
        });
      }
    });
    
    // Location suggestions
    if (lower.includes('near') || lower.includes('in ')) {
      suggestions.push({
        type: 'location',
        text: `${input} near me`,
        subtitle: 'Search nearby'
      });
    }
    
    return suggestions;
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'location') {
      const locationMatch = suggestion.text.match(/in (.+)/) || suggestion.text.match(/near (.+)/);
      if (locationMatch && onLocationChange) {
        onLocationChange(locationMatch[1]);
      }
    }
    
    onChange(suggestion.text);
    saveRecentSearch(suggestion.text);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      saveRecentSearch(value);
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('lendibl-recent-searches');
  };

  const removeRecentSearch = (searchToRemove: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== searchToRemove);
      localStorage.setItem('lendibl-recent-searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSuggestions = getSuggestions();

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-12 text-base bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-500"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 h-8 w-8 p-0 -translate-y-1/2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && currentSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {!value.trim() && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="h-auto p-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          
          <div className="py-1">
            {currentSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {suggestion.type === 'recent' && (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  )}
                  {suggestion.type === 'location' && (
                    <MapPin className="h-4 w-4 text-blue-500" />
                  )}
                  {suggestion.type === 'item' && !suggestion.subtitle && (
                    <Search className="h-4 w-4 text-gray-400" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {suggestion.count && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                  {suggestion.type === 'recent' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(suggestion.text);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {!value.trim() && (
            <>
              <Separator />
              <div className="p-3 text-center">
                <p className="text-sm text-gray-500">
                  Start typing to search for items, categories, or locations
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}