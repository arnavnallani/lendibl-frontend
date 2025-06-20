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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-bold text-gray-dark mb-6">List Your Items</h2>
          <p className="text-xl text-gray-medium mb-8">Turn your unused items into income by renting them out to your neighbors.</p>
          <Link href="/list-item">
            <Button className="bg-primary-blue text-white font-semibold px-8 py-4 rounded-lg hover:bg-primary-blue/90 transition-colors">
              Start Listing
            </Button>
          </Link>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <Link href="/list-item">
        <Button className="fixed bottom-6 right-6 bg-primary-blue text-white p-4 rounded-full shadow-lg hover:bg-primary-blue/90 transition-colors lg:hidden">
          <Plus className="h-6 w-6" />
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
