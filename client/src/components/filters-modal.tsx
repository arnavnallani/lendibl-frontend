import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, SlidersHorizontal, DollarSign, MapPin, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [priceRange, setPriceRange] = useState<number[]>([currentFilters.priceRange === "0-25" ? 25 : currentFilters.priceRange === "25-50" ? 50 : currentFilters.priceRange === "50-100" ? 100 : 150]);
  const [location, setLocation] = useState<string>(currentFilters.location || "");
  const [minRating, setMinRating] = useState<number[]>([currentFilters.minRating || 0]);
  const [availability, setAvailability] = useState<string>(currentFilters.availability || "");
  const [sortBy, setSortBy] = useState<string>(currentFilters.sortBy || "");
  const [instantBooking, setInstantBooking] = useState<boolean>(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCategory(currentFilters.categoryId?.toString() || "");
      setPriceRange([currentFilters.priceRange === "0-25" ? 25 : currentFilters.priceRange === "25-50" ? 50 : currentFilters.priceRange === "50-100" ? 100 : 150]);
      setLocation(currentFilters.location || "");
      setMinRating([currentFilters.minRating || 0]);
      setAvailability(currentFilters.availability || "");
      setSortBy(currentFilters.sortBy || "");
    }
  }, [open, currentFilters]);

  const handleApplyFilters = () => {
    const priceRangeValue = priceRange[0] <= 25 ? "0-25" : 
                           priceRange[0] <= 50 ? "25-50" : 
                           priceRange[0] <= 100 ? "50-100" : "100+";

    onFiltersApply({
      categoryId: selectedCategory && selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
      priceRange: priceRangeValue,
      location: location || undefined,
      minRating: minRating[0] > 0 ? minRating[0] : undefined,
      availability: availability || undefined,
      sortBy: sortBy || undefined,
    });
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setPriceRange([150]);
    setLocation("");
    setMinRating([0]);
    setAvailability("");
    setSortBy("");
    setInstantBooking(false);
    
    onFiltersApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Maximum Price per Day: ${priceRange[0]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={150}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$5</span>
              <span>$150+</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              type="text"
              placeholder="Enter city, state, or zip code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Minimum Owner Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Minimum Owner Rating: {minRating[0] > 0 ? `${minRating[0]} stars` : "Any rating"}
            </Label>
            <Slider
              value={minRating}
              onValueChange={setMinRating}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Any</span>
              <span>5 ⭐</span>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Availability
            </Label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger>
                <SelectValue placeholder="Any availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any availability</SelectItem>
                <SelectItem value="now">available now</SelectItem>
                <SelectItem value="later_this_week">available later this week</SelectItem>
                <SelectItem value="next_week">available next week</SelectItem>
                <SelectItem value="later_than_next_week">available later than next week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sort Results By</Label>
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
                <SelectItem value="distance">Closest to Me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="instant-booking" 
                checked={instantBooking}
                onCheckedChange={setInstantBooking}
              />
              <Label htmlFor="instant-booking" className="text-sm">
                Instant booking available
              </Label>
            </div>
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