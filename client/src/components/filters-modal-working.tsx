import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Star } from "lucide-react";

interface FiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiltersApply: (filters: any) => void;
  currentFilters: any;
}

export default function FiltersModal({ open, onOpenChange, onFiltersApply, currentFilters }: FiltersModalProps) {
  const [minRating, setMinRating] = useState(currentFilters.minRating || 0);
  const [availability, setAvailability] = useState(currentFilters.availability || "all");
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || "relevance");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");

  // Update state when currentFilters change (from localStorage restoration)
  React.useEffect(() => {
    setMinRating(currentFilters.minRating || 0);
    setAvailability(currentFilters.availability || "all");
    setSortBy(currentFilters.sortBy || "relevance");
    setMinPrice(currentFilters.minPrice || "");
    setMaxPrice(currentFilters.maxPrice || "");
  }, [currentFilters]);

  const handleApply = () => {
    const filters = {
      ...currentFilters, // Keep existing filters (categoryId, priceRange, location, etc.)
      minRating: minRating > 0 ? minRating : undefined,
      availability: availability !== "all" ? availability : undefined,
      sortBy: sortBy !== "relevance" ? sortBy : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    onFiltersApply(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setMinRating(0);
    setAvailability("all");
    setSortBy("relevance");
    setMinPrice("");
    setMaxPrice("");
  };

  const activeFiltersCount = [
    minRating > 0,
    availability !== "all",
    sortBy !== "relevance",
    minPrice,
    maxPrice
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Minimum Owner Rating */}
          <div className="space-y-2">
            <Label>Minimum Owner Rating</Label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                  className={`p-1 rounded ${
                    rating <= minRating 
                      ? "text-yellow-500" 
                      : "text-gray-300 hover:text-yellow-400"
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
              {minRating > 0 && (
                <span className="text-sm text-gray-600">
                  {minRating}+ stars
                </span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="Available Now">Available Now</SelectItem>
                <SelectItem value="Available Later This Week">Available Later This Week</SelectItem>
                <SelectItem value="Available Next Week">Available Next Week</SelectItem>
                <SelectItem value="Available Later Than Next Week">Available Later Than Next Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Owner Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price Range (per day)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="flex-1"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}