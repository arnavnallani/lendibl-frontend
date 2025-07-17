import { useState, useEffect } from "react";
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
    minRating?: number;
    availability?: string;
    sortBy?: string;
  }>({});
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [useAIResults, setUseAIResults] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      localStorage.setItem('lendibl_filters', JSON.stringify(filters));
    }
  }, [filters]);

  // Restore filters from localStorage on component mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('lendibl_filters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFilters(parsedFilters);
        
        // If we have a search query, set AI results state accordingly
        if (parsedFilters.search && parsedFilters.search.length >= 3) {
          setUseAIResults(true);
          setShowRecommendations(false);
        } else if (parsedFilters.search && parsedFilters.search.length >= 1) {
          setShowRecommendations(false);
        }
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, []);
  
  // Get AI search results
  const { data: aiSearchResults = [], isLoading: aiLoading } = useAISearch(filters.search || '');

  // Restore scroll position when returning from item details
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem('homeScrollPosition');
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        localStorage.removeItem('homeScrollPosition'); // Clean up
      }, 100);
    }
  }, []);

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
    setShowRecommendations(!newFilters.search || newFilters.search.length === 0);
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
          
          {user && showRecommendations && !filters.search && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <RecommendationsSection onItemClick={handleItemClick} />
            </div>
          )}
          
          <div id="items-section">
            <FilterBar 
              onFiltersChange={handleFiltersChange} 
              selectedCategoryId={filters.categoryId}
              currentViewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <ItemGrid 
              filters={filters} 
              aiResults={aiSearchResults}
              useAIResults={useAIResults}
              aiLoading={aiLoading}
              onItemClick={handleItemClick} 
              viewMode={viewMode}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <HeroSection onCategorySelect={handleCategorySelect} />
          
          {user && showRecommendations && !filters.search && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <RecommendationsSection onItemClick={handleItemClick} />
            </div>
          )}
          
          <div id="items-section">
            <FilterBar 
              onFiltersChange={handleFiltersChange} 
              selectedCategoryId={filters.categoryId}
              currentViewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <ItemGrid 
              filters={filters} 
              aiResults={aiSearchResults}
              useAIResults={useAIResults}
              aiLoading={aiLoading}
              onItemClick={handleItemClick} 
              viewMode={viewMode}
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
