import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Star, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { ItemWithDetails, InsertBooking } from "@shared/schema";
import AuthModal from "./auth-modal";

interface BookingModalProps {
  item: ItemWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ item, isOpen, onClose }: BookingModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createBookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: () => {
      toast({
        title: "Booking request sent!",
        description: "The owner will review your request and respond soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onClose();
      setStartDate("");
      setEndDate("");
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!item) return null;

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = calculateDays();
  const subtotal = days * parseFloat(item.price);
  const serviceFee = subtotal * 0.06; // 6% service fee
  const total = subtotal + serviceFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    const booking = {
      itemId: item.id,
      startDate: startDate,
      endDate: endDate,
      totalPrice: total.toFixed(2),
      message: message || "",
    };

    createBookingMutation.mutate(booking);
  };

  const defaultImage = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-dark">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Gallery */}
          <div className="lg:w-1/2">
            <img 
              src={imageUrl}
              alt={item.title} 
              className="w-full h-80 object-cover rounded-xl"
            />
            
            {/* Additional images would go here */}
            <div className="flex space-x-3 mt-4">
              <img 
                src={imageUrl}
                alt={`${item.title} thumbnail`} 
                className="w-20 h-16 object-cover rounded-lg border-2 border-primary"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="lg:w-1/2">
            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-dark">${item.price}</span>
                <span className="text-lg text-gray-medium">/day</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-dark">{item.rating}</span>
                <span className="text-gray-medium">({item.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <h4 className="font-semibold text-gray-dark mb-3">Select Dates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="startDate" className="block text-sm text-gray-medium mb-1">
                      Check-in
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="block text-sm text-gray-medium mb-1">
                      Check-out
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message" className="block text-sm text-gray-medium mb-1">
                  Message to owner (optional)
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the owner about your rental needs..."
                  className="w-full p-3 border border-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* Pricing Breakdown */}
              {days > 0 && (
                <div className="p-4 bg-gray-bg rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-medium">${item.price} × {days} days</span>
                    <span className="text-gray-dark">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-medium">Service fee</span>
                    <span className="text-gray-dark">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-light pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-gray-dark">Total</span>
                      <span className="text-gray-dark">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <div className="p-4 border border-gray-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-secondary-black rounded-full flex items-center justify-center">
                    {item.owner.avatar ? (
                      <img src={item.owner.avatar} alt={item.owner.firstName} className="w-full h-full rounded-full" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-dark">
                      {item.owner.firstName} {item.owner.lastName}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-medium">Response rate: {item.owner.responseRate}%</span>
                      <span className="w-1 h-1 bg-gray-medium rounded-full"></span>
                      <span className="text-sm text-gray-medium">{item.owner.responseTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={createBookingMutation.isPending}
                className="w-full bg-primary-blue text-white font-semibold py-4 rounded-lg hover:bg-primary-blue/90 transition-colors"
              >
                {createBookingMutation.isPending ? "Sending Request..." : user ? "Request to Book" : "Login to Book"}
              </Button>

              <p className="text-sm text-gray-medium text-center">
                {user ? "You won't be charged yet" : "Please login to make a booking request"}
              </p>
            </form>
          </div>
        </div>

        {/* Item Description */}
        <div className="border-t border-gray-light pt-6">
          <h4 className="font-semibold text-gray-dark mb-3">About this item</h4>
          <p className="text-gray-medium mb-4">{item.description}</p>
          
          {item.included && item.included.length > 0 && (
            <>
              <h5 className="font-medium text-gray-dark mb-2">What's included:</h5>
              <ul className="text-gray-medium space-y-1">
                {item.included.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          defaultTab="login"
        />
      </DialogContent>
    </Dialog>
  );
}
