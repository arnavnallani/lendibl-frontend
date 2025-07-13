import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import ItemCard from '@/components/item-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Star, MapPin, Clock, Package, Eye, Edit, ArrowLeft, Home, Trash2, MoreVertical, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@assets/lendibl_logo1_1750383971030.png";
import Footer from "@/components/footer";
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

const editItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  categoryId: z.number().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).default([]),
  included: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;
type EditItemFormData = z.infer<typeof editItemSchema>;

export default function MyProfile() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedItem, setSelectedItem] = useState<ItemWithDetails | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemWithDetails | null>(null);
  const [itemImageUrls, setItemImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedRenter, setSelectedRenter] = useState<any>(null);
  const [isRenterProfileOpen, setIsRenterProfileOpen] = useState(false);

  // Handle URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      // Map notification tab names to actual tab values
      const tabMapping: { [key: string]: string } = {
        'listings': 'listings',
        'requests': 'rentals', // booking requests go to rentals tab
        'bookings': 'bookings',
        'rentals': 'rentals',
        'reviews': 'reviews'
      };
      
      const mappedTab = tabMapping[tabParam] || 'listings';
      setActiveTab(mappedTab);
    }
  }, [location]);

  const profileForm = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const itemForm = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      categoryId: 1,
      location: '',
      images: [],
      included: [],
      available: true,
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
    queryKey: ['/api/items', 'myItems', user?.id],
    queryFn: async (): Promise<ItemWithDetails[]> => {
      const response = await api.getItems({ ownerId: user?.id });
      return response.items || [];
    },
    enabled: !!user,
  });

  const { data: myBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings', user?.id],
    queryFn: () => api.getBookings(user?.id),
    enabled: !!user,
  });

  const { data: myRentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ['/api/bookings', 'rentals', user?.id],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      const allBookings = await api.getBookings();
      return allBookings.filter(booking => booking.item.ownerId === user?.id);
    },
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => api.getCategories(),
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
    setItemImageUrls(item.images || []);
    itemForm.reset({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId,
      location: item.location,
      images: item.images || [],
      included: item.included || [],
      available: item.available,
    });
    setIsEditItemOpen(true);
  };

  const addItemImage = () => {
    if (newImageUrl && !itemImageUrls.includes(newImageUrl)) {
      setItemImageUrls([...itemImageUrls, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeItemImage = (index: number) => {
    setItemImageUrls(itemImageUrls.filter((_, i) => i !== index));
  };

  // Booking action mutation with immediate feedback
  const bookingActionMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return api.updateBooking(bookingId, { status });
    },
    onSuccess: (_, { status }) => {
      // Invalidate all booking-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      // Show success toast
      toast({
        title: status === 'approved' ? 'Booking Approved' : 'Booking Declined',
        description: status === 'approved' 
          ? 'The rental request has been approved successfully.' 
          : 'The rental request has been declined.',
      });
    },
    onError: (error) => {
      console.error('Failed to update booking:', error);
      toast({
        title: 'Action Failed',
        description: 'Unable to update the booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleBookingAction = (bookingId: number, status: string) => {
    bookingActionMutation.mutate({ bookingId, status });
  };

  const handleCancelBooking = async (bookingId: number, bookingStatus: string) => {
    const isApproved = bookingStatus === 'approved';
    const warningMessage = isApproved 
      ? 'Are you sure you want to cancel this approved booking? This booking was already approved, so NO REFUND will be issued.'
      : 'Are you sure you want to cancel this booking? You will receive a full refund.';
      
    if (!confirm(warningMessage)) {
      return;
    }
    
    try {
      await api.updateBooking(bookingId, { status: 'cancelled' });
      // Refresh the bookings data
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const handleRenterClick = (renter: any) => {
    setSelectedRenter(renter);
    setIsRenterProfileOpen(true);
  };

  const onSubmitItemEdit = async (values: EditItemFormData) => {
    if (!selectedItem) return;
    
    try {
      await api.updateItem(selectedItem.id, {
        ...values,
        price: parseFloat(values.price),
        images: itemImageUrls,
      });
      setIsEditItemOpen(false);
      setSelectedItem(null);
      // Refresh items
      window.location.reload();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleDeleteItem = async (item: ItemWithDetails) => {
    try {
      await api.deleteItem(item.id);
      setItemToDelete(null);
      // Refresh items
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
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
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
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
                    <span className="text-sm font-medium">{user.rating || '0'} rating</span>
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
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
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
                          control={profileForm.control}
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
                          control={profileForm.control}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 sm:gap-0">
            <TabsTrigger value="listings" className="text-xs sm:text-sm">
              <span className="sm:hidden">Listings ({totalListings})</span>
              <span className="hidden sm:inline">My Listings ({totalListings})</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm">
              <span className="sm:hidden">Bookings ({myBookings.length})</span>
              <span className="hidden sm:inline">My Bookings ({myBookings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rentals" className="text-xs sm:text-sm">
              <span className="sm:hidden">Rentals ({myRentals.length})</span>
              <span className="hidden sm:inline">Rental Requests ({myRentals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reviews</TabsTrigger>
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
                        <div className="absolute top-2 right-2 flex gap-2">
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
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.item.title}</h4>
                            <p className="text-sm text-gray-medium">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-lg font-bold text-primary-blue">${booking.totalPrice}</p>
                            {booking.message && (
                              <p className="text-sm text-gray-medium mt-2">Message: {booking.message}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              booking.status === 'approved' ? 'default' : 
                              booking.status === 'pending' ? 'secondary' : 
                              booking.status === 'completed' ? 'default' : 'destructive'
                            }>
                              {booking.status}
                            </Badge>
                            {(booking.status === 'pending' || booking.status === 'approved') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id, booking.status)}
                                className={booking.status === 'pending' 
                                  ? "text-red-600 border-red-300 hover:bg-red-50"
                                  : "text-orange-600 border-orange-300 hover:bg-orange-50"
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
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
                              Requested by{' '}
                              <button 
                                onClick={() => handleRenterClick(rental.renter)}
                                className="text-primary-blue hover:underline font-medium"
                              >
                                {rental.renter.firstName} {rental.renter.lastName}
                              </button>
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
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleBookingAction(rental.id, 'approved')}
                                  disabled={bookingActionMutation.isPending}
                                >
                                  {bookingActionMutation.isPending ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleBookingAction(rental.id, 'rejected')}
                                  disabled={bookingActionMutation.isPending}
                                >
                                  {bookingActionMutation.isPending ? 'Declining...' : 'Decline'}
                                </Button>
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

        {/* Edit Item Modal */}
        <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <Form {...itemForm}>
              <form onSubmit={itemForm.handleSubmit(onSubmitItemEdit)} className="space-y-4">
                <FormField
                  control={itemForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your item" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={itemForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per day</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={itemForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={itemForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="included"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's Included</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter what's included (one item per line)&#10;Example:&#10;Extra battery&#10;Memory card&#10;Carrying case"
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => {
                            const items = e.target.value.split('\n').filter(item => item.trim() !== '');
                            field.onChange(items);
                          }}
                          className="min-h-[100px]"
                          style={{ whiteSpace: 'pre-wrap' }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">Enter each item on a new line</p>
                    </FormItem>
                  )}
                />
                
                {/* Image Management Section */}
                <div className="space-y-4 border-2 border-blue-200 p-4 rounded-lg bg-blue-50">
                  <FormLabel className="text-lg font-semibold text-blue-700">Manage Photos</FormLabel>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Current photos: {itemImageUrls.length}
                  </div>
                  
                  {itemImageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {itemImageUrls.map((url, index) => (
                        <Card key={index} className="relative">
                          <CardContent className="p-2">
                            <img 
                              src={url} 
                              alt={`Item photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeItemImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>No photos yet. Add some photos to make your listing more attractive!</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL (e.g., from Unsplash)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItemImage}
                      disabled={!newImageUrl}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Add high-quality photos to attract more renters. You can use image URLs from sites like Unsplash.
                  </p>
                </div>
                
                <div className="flex justify-between pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Listing
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this listing? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => selectedItem && handleDeleteItem(selectedItem)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditItemOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Renter Profile Modal */}
        <Dialog open={isRenterProfileOpen} onOpenChange={setIsRenterProfileOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Renter Profile</DialogTitle>
            </DialogHeader>
            {selectedRenter && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary-blue text-white">
                      {selectedRenter.firstName[0]}{selectedRenter.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedRenter.firstName} {selectedRenter.lastName}
                    </h3>
                    <p className="text-gray-medium">{selectedRenter.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-blue">4.8</div>
                    <div className="text-xs text-gray-medium">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">95%</div>
                    <div className="text-xs text-gray-medium">Response Rate</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Excellent renter with 12+ successful bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Usually responds within 30 minutes</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => setIsRenterProfileOpen(false)} 
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
    </div>
  );
}