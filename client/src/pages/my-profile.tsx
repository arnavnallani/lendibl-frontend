import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import ItemCard from '@/components/item-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Star, MapPin, Clock, Package, Eye, Edit, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ItemWithDetails, BookingWithDetails } from '@shared/schema';

const editProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function MyProfile() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const onSubmitProfile = async (values: EditProfileFormData) => {
    try {
      await api.updateProfile(values);
      setIsEditProfileOpen(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const { data: myItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items', 'myItems'],
    queryFn: async (): Promise<ItemWithDetails[]> => {
      const allItems = await api.getItems();
      return allItems.filter(item => item.ownerId === user?.id);
    },
    enabled: !!user,
  });

  const { data: myBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings', user?.id],
    queryFn: () => api.getBookings(user?.id),
    enabled: !!user,
  });

  const { data: myRentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ['/api/bookings', 'rentals'],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      const allBookings = await api.getBookings();
      return allBookings.filter(booking => booking.item.ownerId === user?.id);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Profile Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleItemClick = (item: ItemWithDetails) => {
    setSelectedItem(item);
  };

  const totalEarnings = myRentals
    .filter(rental => rental.status === 'completed')
    .reduce((sum, rental) => sum + parseFloat(rental.totalPrice), 0);

  const activeListings = myItems.filter(item => item.available).length;
  const totalListings = myItems.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-medium" />
              <span className="text-sm text-gray-medium">/</span>
              <span className="text-sm font-medium text-gray-dark">My Profile</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-lg bg-primary-blue text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-dark mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-medium mb-4">{user.email}</p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">4.8 rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary-blue" />
                    <span className="text-sm">{totalListings} items listed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Usually responds within 1 hour</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-blue">{activeListings}</div>
                    <div className="text-xs text-gray-medium">Active Listings</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(0)}</div>
                    <div className="text-xs text-gray-medium">Total Earnings</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{myRentals.length}</div>
                    <div className="text-xs text-gray-medium">Rental Requests</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{myBookings.length}</div>
                    <div className="text-xs text-gray-medium">My Bookings</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Link href="/list-item">
                  <Button className="w-full">List New Item</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="listings">My Listings ({totalListings})</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings ({myBookings.length})</TabsTrigger>
            <TabsTrigger value="rentals">Rental Requests ({myRentals.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  My Listed Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : myItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myItems.map((item) => (
                      <div key={item.id} className="relative">
                        <ItemCard item={item} onClick={handleItemClick} />
                        <div className="absolute top-2 right-2">
                          <Badge variant={item.available ? "default" : "secondary"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-dark mb-2">No items listed yet</h3>
                    <p className="text-gray-medium mb-4">Start earning by listing your first item!</p>
                    <Link href="/list-item">
                      <Button>List Your First Item</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : myBookings.length > 0 ? (
                  <div className="space-y-4">
                    {myBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{booking.item.title}</h4>
                            <p className="text-sm text-gray-medium">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-bold text-primary-blue">${booking.totalPrice}</p>
                          </div>
                          <Badge variant={
                            booking.status === 'approved' ? 'default' : 
                            booking.status === 'pending' ? 'secondary' : 
                            booking.status === 'completed' ? 'default' : 'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-dark mb-2">No bookings yet</h3>
                    <p className="text-gray-medium">Start browsing items to make your first booking!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rentals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Requests for My Items</CardTitle>
              </CardHeader>
              <CardContent>
                {rentalsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : myRentals.length > 0 ? (
                  <div className="space-y-4">
                    {myRentals.map((rental) => (
                      <div key={rental.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{rental.item.title}</h4>
                            <p className="text-sm text-gray-medium">
                              Requested by {rental.renter.firstName} {rental.renter.lastName}
                            </p>
                            <p className="text-sm text-gray-medium">
                              {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-bold text-primary-blue">${rental.totalPrice}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant={
                              rental.status === 'approved' ? 'default' : 
                              rental.status === 'pending' ? 'secondary' : 
                              rental.status === 'completed' ? 'default' : 'destructive'
                            }>
                              {rental.status}
                            </Badge>
                            {rental.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">Approve</Button>
                                <Button size="sm" variant="destructive">Decline</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-dark mb-2">No rental requests</h3>
                    <p className="text-gray-medium">When someone requests to rent your items, they'll appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-dark mb-2">No reviews yet</h3>
                  <p className="text-gray-medium">Complete transactions to start receiving reviews from other users.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}