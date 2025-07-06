import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import FilterBar from "@/components/filter-bar";
import ItemGrid from "@/components/item-grid";
import BookingModal from "@/components/booking-modal";
import RecommendationsSection from "@/components/recommendations-section";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAISearch } from "@/hooks/use-ai-search";
import type { ItemWithDetails } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentMode, setCurrentMode] = useState<"renter" | "lister">("renter");
  const [filters, setFilters] = useState<{
    categoryId?: number;
    search?: string;
    priceRange?: string;
    location?: string;
  }>({});
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [useAIResults, setUseAIResults] = useState(false);
  
  // Get AI search results
  const { data: aiSearchResults = [], isLoading: aiLoading } = useAISearch(filters.search || '');

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setUseAIResults(query.length >= 3); // Use AI for queries 3+ characters
    if (query.length >= 1) {
      setShowRecommendations(false);
    } else {
      setShowRecommendations(true);
      setUseAIResults(false);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setFilters(prev => ({ ...prev, categoryId }));
    setShowRecommendations(false);
    
    // Scroll to items section with smooth animation
    setTimeout(() => {
      const itemsSection = document.querySelector('#items-section');
      if (itemsSection) {
        itemsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setShowRecommendations(Object.keys(newFilters).length === 0);
  };

  const handleItemClick = (item: ItemWithDetails) => {
    // Navigate to item details page for all items
    setLocation(`/item/${item.id}`);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemUpdated = () => {
    // Refresh the page to show updated items
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onSearch={handleSearch}
      />
      
      {currentMode === "renter" ? (
        <div className="space-y-8">
          <HeroSection onCategorySelect={handleCategorySelect} />
          
          {user && showRecommendations && Object.keys(filters).length === 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <RecommendationsSection onItemClick={handleItemClick} />
            </div>
          )}
          
          <div id="items-section">
            <FilterBar 
              onFiltersChange={handleFiltersChange} 
              selectedCategoryId={filters.categoryId}
            />
            <ItemGrid 
              filters={filters} 
              aiResults={aiSearchResults}
              useAIResults={useAIResults}
              aiLoading={aiLoading}
              onItemClick={handleItemClick} 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <HeroSection onCategorySelect={handleCategorySelect} />
          
          {user && showRecommendations && Object.keys(filters).length === 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <RecommendationsSection onItemClick={handleItemClick} />
            </div>
          )}
          
          <div id="items-section">
            <FilterBar 
              onFiltersChange={handleFiltersChange} 
              selectedCategoryId={filters.categoryId}
            />
            <ItemGrid 
              filters={filters} 
              aiResults={aiSearchResults}
              useAIResults={useAIResults}
              aiLoading={aiLoading}
              onItemClick={handleItemClick} 
            />
          </div>
        </div>
      )}

      <Footer />
      
      {/* Floating Action Button (Mobile) */}
      <Link href="/list-item">
        <Button className="fixed bottom-8 right-8 btn-primary text-white p-5 rounded-2xl shadow-2xl lg:hidden animate-float hover-glow z-50">
          <Plus className="h-7 w-7" />
        </Button>
      </Link>
      
      <BookingModal 
        item={selectedItem}
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
      />

      {/* Temporarily removed EditItemModal to fix the issue */}
    </div>
  );
}
