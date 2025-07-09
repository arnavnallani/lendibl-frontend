import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, MapPin, User, Edit } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import BookingModal from "@/components/booking-modal";
import EditItemModal from "@/components/edit-item-modal";
import type { ItemWithDetails } from "@shared/schema";

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Extract city and state from location for privacy
  const getDisplayLocation = (location: string) => {
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 3) {
      const city = parts[1] || '';
      const stateZip = parts[2] || '';
      const state = stateZip.split(' ')[0] || '';
      return `${city}, ${state}`;
    }
    return location; // Fallback to full location if parsing fails
  };
  
  const { data: item, isLoading, error } = useQuery({
    queryKey: ["/api/items", parseInt(id!)],
    queryFn: () => api.getItem(parseInt(id!)),
    enabled: !!id,
  });

  const isOwner = user && item && item.ownerId === user.id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-dark mb-4">Item Not Found</h1>
              <p className="text-gray-medium mb-6">The item you're looking for doesn't exist or has been removed.</p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;

  const handleBookNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to reserve items",
        variant: "destructive",
      });
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleEditItem = () => {
    setIsEditModalOpen(true);
  };

  const handleBackToListings = () => {
    const savedScrollPosition = localStorage.getItem('homeScrollPosition');
    setLocation('/');
    
    // Restore scroll position after navigation
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" className="mb-4" onClick={handleBackToListings}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to listings
          </Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <img 
              src={imageUrl}
              alt={item.title}
              className="w-full h-96 lg:h-[500px] object-cover rounded-xl"
            />
          </div>

          {/* Item Details */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-medium font-medium">{item.category.name}</span>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-dark ml-1">{item.rating}</span>
                <span className="text-gray-medium ml-1">({item.reviewCount} reviews)</span>
                <span className="mx-2 text-gray-light">•</span>
                <MapPin className="h-4 w-4 text-gray-medium" />
                <span className="text-gray-medium ml-1">{getDisplayLocation(item.location)}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-dark mb-4">{item.title}</h1>
            
            <div className="flex items-baseline space-x-2 mb-6">
              <span className="text-4xl font-bold text-gray-dark">${item.price}</span>
              <span className="text-xl text-gray-medium">/day</span>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-dark mb-3">Description</h3>
              <p className="text-gray-medium leading-relaxed">{item.description}</p>
            </div>

            {item.included && item.included.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-dark mb-3">What's Included</h3>
                <ul className="text-gray-medium space-y-2">
                  {item.included.map((includedItem, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {includedItem}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Owner Info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-dark mb-4">Meet your host</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-secondary-black rounded-full flex items-center justify-center">
                    {item.owner.avatar ? (
                      <img 
                        src={item.owner.avatar} 
                        alt={item.owner.firstName} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <User className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h4 
                      className="font-semibold text-primary-blue hover:text-primary-blue/80 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/user/${item.owner.id}`)}
                    >
                      {item.owner.firstName} {item.owner.lastName}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-medium">
                      <span>⭐ {item.owner.rating} rating</span>
                      <span>📞 {item.owner.responseRate}% response rate</span>
                      <span>⏱️ {item.owner.responseTime}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isOwner ? (
                <Button 
                  onClick={handleEditItem}
                  className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white py-4"
                  size="lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
              ) : (
                <Button 
                  onClick={handleBookNow}
                  className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white py-4"
                  size="lg"
                >Open Reservation Page</Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <BookingModal 
        item={item}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
      <EditItemModal 
        item={item}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onItemUpdated={() => {
          setIsEditModalOpen(false);
          // Refresh item data
          window.location.reload();
        }}
      />
    </div>
  );
}
