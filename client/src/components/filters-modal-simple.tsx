import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersApply: (filters: {
    categoryId?: number;
    priceRange?: string;
    location?: string;
    minRating?: number;
    availability?: string;
    sortBy?: string;
  }) => void;
  currentFilters?: {
    categoryId?: number;
    priceRange?: string;
    location?: string;
    minRating?: number;
    availability?: string;
    sortBy?: string;
  };
}

export default function FiltersModal({ 
  open, 
  onOpenChange, 
  onFiltersApply, 
  currentFilters = {} 
}: FiltersModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters.categoryId?.toString() || "");
  const [priceRange, setPriceRange] = useState<string>(currentFilters.priceRange || "");
  const [location, setLocation] = useState<string>(currentFilters.location || "");
  const [sortBy, setSortBy] = useState<string>(currentFilters.sortBy || "");

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  const handleApplyFilters = () => {
    onFiltersApply({
      categoryId: selectedCategory && selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
      priceRange: priceRange || undefined,
      location: location || undefined,
      sortBy: sortBy || undefined,
    });
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setPriceRange("");
    setLocation("");
    setSortBy("");
    
    onFiltersApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Range</Label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any price</SelectItem>
                <SelectItem value="0-25">$0 - $25</SelectItem>
                <SelectItem value="25-50">$25 - $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100+">$100+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            <Input
              placeholder="Enter city or location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Default sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default sorting</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button 
            onClick={handleApplyFilters}
            className="flex-1 bg-primary-blue hover:bg-blue-600"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}