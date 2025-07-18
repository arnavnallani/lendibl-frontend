import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, MapPin, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import FiltersModal from "./filters-modal-working";

interface FilterBarProps {
  onFiltersChange: (filters: {
    categoryId?: number;
    priceRange?: string;
    location?: string;
    minRating?: number;
    availability?: string;
    sortBy?: string;
  }) => void;
  selectedCategoryId?: number;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  currentViewMode?: 'grid' | 'list';
}

export default function FilterBar({ 
  onFiltersChange, 
  selectedCategoryId, 
  onViewModeChange, 
  currentViewMode = 'grid' 
}: FilterBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  // Restore filter values from localStorage on component mount
  React.useEffect(() => {
    const savedFilters = localStorage.getItem('lendibl_filters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        if (parsedFilters.categoryId) {
          setSelectedCategory(parsedFilters.categoryId.toString());
        }
        if (parsedFilters.priceRange) {
          setSelectedPriceRange(parsedFilters.priceRange);
        }
        if (parsedFilters.location) {
          setLocation(parsedFilters.location);
        }
        setCurrentFilters(parsedFilters);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, []);

  // Update selected category when prop changes (from hero section)
  React.useEffect(() => {
    if (selectedCategoryId) {
      setSelectedCategory(selectedCategoryId.toString());
    }
  }, [selectedCategoryId]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const categoryId = value === "all" ? undefined : parseInt(value);
    onFiltersChange({
      categoryId,
      priceRange: selectedPriceRange || undefined,
      location: location || undefined,
    });
  };

  const handlePriceRangeChange = (value: string) => {
    setSelectedPriceRange(value);
    onFiltersChange({
      categoryId: selectedCategory === "all" ? undefined : parseInt(selectedCategory),
      priceRange: value === "all" ? undefined : value,
      location: location || undefined,
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onFiltersChange({
      categoryId: selectedCategory === "all" ? undefined : parseInt(selectedCategory),
      priceRange: selectedPriceRange || undefined,
      location: newLocation || undefined,
    });
  };

  const handleAdvancedFilters = (filters: any) => {
    setCurrentFilters(filters);
    // Update basic filters state to match advanced filters
    if (filters.categoryId) {
      setSelectedCategory(filters.categoryId.toString());
    }
    if (filters.priceRange) {
      setSelectedPriceRange(filters.priceRange);
    }
    if (filters.location) {
      setLocation(filters.location);
    }
    onFiltersChange(filters);
  };

  const handleViewModeToggle = () => {
    const newMode = currentViewMode === 'grid' ? 'list' : 'grid';
    onViewModeChange?.(newMode);
  };

  // Count active advanced filters
  const getActiveAdvancedFiltersCount = () => {
    let count = 0;
    if (currentFilters.minRating && currentFilters.minRating > 0) count++;
    if (currentFilters.availability && currentFilters.availability !== "all") count++;
    if (currentFilters.sortBy && currentFilters.sortBy !== "relevance") count++;
    if (currentFilters.minPrice) count++;
    if (currentFilters.maxPrice) count++;
    return count;
  };

  const getActiveFiltersDisplay = () => {
    const filters = [];
    if (currentFilters.minRating && currentFilters.minRating > 0) {
      filters.push(`${currentFilters.minRating}+ stars`);
    }
    if (currentFilters.availability && currentFilters.availability !== "all") {
      filters.push(currentFilters.availability);
    }
    if (currentFilters.sortBy && currentFilters.sortBy !== "relevance") {
      filters.push(`Sort: ${currentFilters.sortBy}`);
    }
    if (currentFilters.minPrice || currentFilters.maxPrice) {
      const min = currentFilters.minPrice ? `$${currentFilters.minPrice}` : "";
      const max = currentFilters.maxPrice ? `$${currentFilters.maxPrice}` : "";
      if (min && max) {
        filters.push(`$${currentFilters.minPrice}-$${currentFilters.maxPrice}`);
      } else if (min) {
        filters.push(`$${currentFilters.minPrice}+`);
      } else if (max) {
        filters.push(`Under $${currentFilters.maxPrice}`);
      }
    }
    return filters;
  };

  const activeFiltersCount = getActiveAdvancedFiltersCount();
  const activeFiltersDisplay = getActiveFiltersDisplay();

  return (
    <>
      <section className="bg-white border-b border-gray-light py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              variant="outline" 
              onClick={() => setShowFiltersModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-full transition-colors ${
                activeFiltersCount > 0 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-gray-light hover:border-gray-dark'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
            </Button>
          
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-48 px-4 py-2 border border-gray-light rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-gray-dark">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriceRange} onValueChange={handlePriceRangeChange}>
            <SelectTrigger className="w-48 px-4 py-2 border border-gray-light rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-gray-dark">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-25">Under $25/day</SelectItem>
              <SelectItem value="25-50">$25-50/day</SelectItem>
              <SelectItem value="50-100">$50-100/day</SelectItem>
              <SelectItem value="100+">Over $100/day</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 px-4 py-2 border border-gray-light rounded-full">
            <MapPin className="h-4 w-4 text-gray-medium" />
            <Input
              type="text"
              placeholder="Near me"
              value={location}
              onChange={handleLocationChange}
              className="border-none outline-none text-gray-dark bg-transparent"
            />
          </div>

          <Button 
            variant="ghost" 
            onClick={handleViewModeToggle}
            className="ml-auto text-gray-medium hover:text-gray-dark"
          >
            {currentViewMode === 'grid' ? (
              <>
                <List className="h-4 w-4 mr-2" />
                List
              </>
            ) : (
              <>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid
              </>
            )}
          </Button>
        </div>
        
        {/* Active Filters Display */}
        {activeFiltersDisplay.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFiltersDisplay.map((filter, index) => (
              <div
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {filter}
              </div>
            ))}
          </div>
        )}
      </div>
      </section>

      {/* Advanced Filters Modal */}
      <FiltersModal
        open={showFiltersModal}
        onOpenChange={setShowFiltersModal}
        onFiltersApply={handleAdvancedFilters}
        currentFilters={currentFilters}
      />
    </>
  );
}
