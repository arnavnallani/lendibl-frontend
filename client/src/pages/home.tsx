import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import FilterBar from "@/components/filter-bar";
import ItemGrid from "@/components/item-grid";
import BookingModal from "@/components/booking-modal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { ItemWithDetails } from "@shared/schema";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<"renter" | "lister">("renter");
  const [filters, setFilters] = useState<{
    categoryId?: number;
    search?: string;
    priceRange?: string;
    location?: string;
  }>({});
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleCategorySelect = (categoryId: number) => {
    setFilters(prev => ({ ...prev, categoryId }));
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleItemClick = (item: ItemWithDetails) => {
    setSelectedItem(item);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onSearch={handleSearch}
      />
      
      {currentMode === "renter" ? (
        <>
          <HeroSection onCategorySelect={handleCategorySelect} />
          <FilterBar onFiltersChange={handleFiltersChange} />
          <ItemGrid filters={filters} onItemClick={handleItemClick} />
        </>
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
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-dark mb-2">Earn Money</h3>
              <p className="text-gray-medium text-sm">Make money from items sitting unused</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-dark mb-2">Help Community</h3>
              <p className="text-gray-medium text-sm">Support your neighbors and reduce waste</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-dark mb-2">Easy Setup</h3>
              <p className="text-gray-medium text-sm">List items in minutes with our simple flow</p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
