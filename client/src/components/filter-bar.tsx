import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, MapPin, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import FiltersModal from "./filters-modal";

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

  return (
    <>
      <section className="bg-white border-b border-gray-light py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              variant="outline" 
              onClick={() => setShowFiltersModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-light rounded-full hover:border-gray-dark transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4 text-gray-medium" />
              <span className="text-gray-dark font-medium">Filters</span>
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
