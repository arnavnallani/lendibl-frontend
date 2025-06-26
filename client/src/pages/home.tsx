import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import { AIBanner } from "@/components/ai-banner";
import HeroSection from "@/components/hero-section";
import FilterBar from "@/components/filter-bar";
import ItemGrid from "@/components/item-grid";
import BookingModal from "@/components/booking-modal";
import RecommendationsSection from "@/components/recommendations-section";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
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
      <AIBanner />
      
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
            <ItemGrid filters={filters} onItemClick={handleItemClick} />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-slide-up">
            <h2 className="text-5xl font-bold text-gray-dark mb-8 text-gradient">List Your Items</h2>
            <p className="text-xl text-gray-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your unused items into a source of income. Join thousands of users earning by sharing what they own.
            </p>
            <Link href="/list-item">
              <Button className="btn-primary text-white font-bold px-12 py-5 rounded-2xl text-lg hover-lift shadow-2xl">
                Start Earning Today
              </Button>
            </Link>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-fade-in">
            <div className="text-center group hover-float">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-blue/20 to-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg backdrop-blur-sm border border-primary-blue/20">
                <span className="text-3xl animate-pulse-glow">💰</span>
              </div>
              <h3 className="font-bold text-xl text-gray-dark mb-3 group-hover:text-primary-blue transition-colors duration-300">Earn Money</h3>
              <p className="text-gray-medium text-base leading-relaxed">Make money from items sitting unused</p>
            </div>
            <div className="text-center group hover-float">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg backdrop-blur-sm border border-green-400/20">
                <span className="text-3xl animate-pulse-glow">🤝</span>
              </div>
              <h3 className="font-bold text-xl text-gray-dark mb-3 group-hover:text-green-600 transition-colors duration-300">Help Community</h3>
              <p className="text-gray-medium text-base leading-relaxed">Support your neighbors and reduce waste</p>
            </div>
            <div className="text-center group hover-float">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400/20 to-violet-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg backdrop-blur-sm border border-purple-400/20">
                <span className="text-3xl animate-pulse-glow">📱</span>
              </div>
              <h3 className="font-bold text-xl text-gray-dark mb-3 group-hover:text-purple-600 transition-colors duration-300">Easy Setup</h3>
              <p className="text-gray-medium text-base leading-relaxed">List items in minutes with our simple flow</p>
            </div>
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
