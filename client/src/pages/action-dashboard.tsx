import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Home, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  StopCircle, 
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { BookingWithDetails } from "@shared/schema";
import logoImage from "@assets/lendibl_logo1_1750383971030.png";


export default function ActionDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRental, setSelectedRental] = useState<BookingWithDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  
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

  const { data: activeRentals = [], isLoading } = useQuery({
    queryKey: ['/api/bookings', 'active-rentals'],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      const allBookings = await api.getBookings();
      return allBookings.filter(booking => 
        (booking.item.ownerId === user?.id || booking.renterId === user?.id) && 
        ['approved', 'in_progress', 'completed'].includes(booking.status)
      );
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateRentalStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return api.updateBooking(bookingId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ bookingId, message }: { bookingId: number; message: string }) => {
      return api.sendRentalMessage(bookingId, message);
    },
    onSuccess: () => {
      setMessageText("");
      setIsMessageModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/rental-messages'] });
    },
  });

  const getRentalStatus = (rental: BookingWithDetails) => {
    const now = new Date();
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);

    // If booking is approved but not yet started, it's pre-rental
    if (rental.status === 'approved') {
      return 'pre-rental';
    }
    // If booking is in progress, it's active
    else if (rental.status === 'in_progress') {
      return 'active';
    }
    // If booking is completed, it's done
    else if (rental.status === 'completed') {
      return 'completed';
    }
    
    return 'pre-rental';
  };

  const canStartRental = (rental: BookingWithDetails) => {
    return rental.status === 'approved';
  };

  const canEndRental = (rental: BookingWithDetails) => {
    return rental.status === 'in_progress';
  };

  const isRentalOverdue = (rental: BookingWithDetails) => {
    const now = new Date();
    const endDate = new Date(rental.endDate);
    return now > endDate && rental.status === 'in_progress';
  };

  const handleStartRental = (rental: BookingWithDetails) => {
    updateRentalStatusMutation.mutate({
      bookingId: rental.id,
      status: 'in_progress'
    });
  };

  const handleEndRental = (rental: BookingWithDetails) => {
    updateRentalStatusMutation.mutate({
      bookingId: rental.id,
      status: 'completed'
    });
  };

  const handleSendMessage = (rental: BookingWithDetails) => {
    setSelectedRental(rental);
    setIsMessageModalOpen(true);
  };

  const submitMessage = () => {
    if (selectedRental && messageText.trim()) {
      sendMessageMutation.mutate({
        bookingId: selectedRental.id,
        message: messageText.trim()
      });
    }
  };



  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access your action dashboard.</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/5 to-sky-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation Header */}
      <div className="relative bg-white/80 backdrop-blur-sm border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-sky-600" />
              <span className="text-sm text-sky-500">/</span>
              <span className="text-sm font-medium text-blue-900">Action Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="group relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">Action Dashboard</h1>
              <p className="text-blue-600">Track your active rentals and communicate during the process</p>
            </div>
          </div>
        </div>

        {/* Active Rentals */}
        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeRentals.length > 0 ? (
          <div className="grid gap-6">
            {activeRentals.map((rental) => {
              const status = getRentalStatus(rental);
              const isOverdue = isRentalOverdue(rental);
              const isOwner = rental.item.ownerId === user?.id;
              const isRenter = rental.renterId === user?.id;
              
              return (
                <Card key={rental.id} className="overflow-hidden group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-600/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-blue-900">{rental.item.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-sky-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {isOwner ? `Renter: ${rental.renter.firstName} ${rental.renter.lastName}` : 
                             `Owner: ${rental.item.owner.firstName} ${rental.item.owner.lastName}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${rental.totalPrice}
                          </div>
                        </div>
                        
                        {/* Show full address to renter for approved bookings */}
                        {!isOwner && rental.status === 'approved' && rental.item.location && (
                          <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <div className="w-4 h-4 bg-sky-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              </div>
                              <div className="text-sm">
                                <p className="font-medium text-sky-700">Pickup Location</p>
                                <p className="text-sky-600">{rental.item.location}</p>
                                <p className="text-sky-500 text-xs mt-1">Contact the owner to coordinate pickup time</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        <Badge variant={
                          status === 'pre-rental' ? 'secondary' :
                          status === 'active' ? 'default' : 'outline'
                        }>
                          {status === 'pre-rental' ? 'Pre-Rental' :
                           status === 'active' ? 'Active' : 'Completed'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {/* Rental Progress Steps */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === 'pre-rental' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className={`font-medium ${status === 'pre-rental' ? 'text-sky-600' : 'text-emerald-600'}`}>
                            Pre-Rental Period
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === 'active' ? 'bg-blue-500 text-white' : 
                            status === 'pre-rental' ? 'bg-sky-200 text-sky-600' : 'bg-emerald-500 text-white'
                          }`}>
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <span className={`font-medium ${status === 'active' ? 'text-blue-600' : 
                            status === 'completed' ? 'text-emerald-600' : 'text-sky-500'}`}>
                            Rental Period
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-sky-200 text-sky-600'
                          }`}>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className={`font-medium ${status === 'completed' ? 'text-emerald-600' : 'text-sky-500'}`}>
                            Rental Complete
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div className={`h-2 rounded-full transition-all duration-500 ${
                          status === 'pre-rental' ? 'w-1/3 bg-blue-500' :
                          status === 'active' ? 'w-2/3 bg-blue-500' : 
                          status === 'completed' ? 'w-full bg-green-500' : 'w-1/3 bg-blue-500'
                        }`}></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {status !== 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => handleSendMessage(rental)}
                          className="flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {isOwner ? 'Message Renter' : 'Message Owner'}
                        </Button>
                      )}

                      
                      {/* Owner Controls */}
                      {isOwner && canStartRental(rental) && (
                        <Button
                          onClick={() => handleStartRental(rental)}
                          className="flex items-center gap-2"
                          disabled={updateRentalStatusMutation.isPending}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start Rental Period
                        </Button>
                      )}
                      
                      {isOwner && canEndRental(rental) && (
                        <Button
                          onClick={() => handleEndRental(rental)}
                          variant="outline"
                          className="flex items-center gap-2"
                          disabled={updateRentalStatusMutation.isPending}
                        >
                          <StopCircle className="h-4 w-4" />
                          {isOverdue ? 'End Overdue Rental' : 'End Rental Period'}
                        </Button>
                      )}

                      {/* Status Messages */}
                      {status === 'completed' && (
                        <div className="text-green-600 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {isOwner ? 'Rental completed - Payout processed' : 'Rental completed'}
                        </div>
                      )}

                      {/* Renter Status Messages */}
                      {isRenter && status === 'pre-rental' && (
                        <div className="text-blue-600 font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Waiting for owner to start rental period
                        </div>
                      )}

                      {isRenter && status === 'active' && (
                        <div className="text-blue-600 font-medium flex items-center gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Rental is active - enjoy your rental!
                        </div>
                      )}
                    </div>

                    {/* Rental Message */}
                    {rental.message && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Renter's Message:</p>
                        <p className="text-sm text-blue-800">{rental.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-dark mb-2">No Active Rentals</h3>
              <p className="text-gray-medium mb-4">You don't have any active rentals at the moment.</p>
              <Link href="/my-profile">
                <Button>View All Bookings</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Message Renter</DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedRental.item.title}</p>
                <p className="text-sm text-gray-medium">
                  Renter: {selectedRental.renter.firstName} {selectedRental.renter.lastName}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Coordinate pickup time, location, or provide instructions..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsMessageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}