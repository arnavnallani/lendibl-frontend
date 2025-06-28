import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { browserNotifications } from "@/lib/browser-notifications";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import AuthModal from "@/components/auth-modal";
import OwnerPaymentSetupModal from "@/components/owner-payment-setup-modal";
import Footer from "@/components/footer";
import { AIPricingSuggestions } from "@/components/ai-pricing-suggestions";
import { ImageUpload } from "@/components/image-upload";

const formSchema = insertItemSchema.extend({
  price: z.coerce.number().min(0, "Price must be a positive number").optional(),
  categoryId: z.coerce.number().min(1, "Category is required"),
  includedItems: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Valid zip code is required"),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
});

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

type FormValues = z.infer<typeof formSchema>;

export default function ListItem() {
  const [, setLocation] = useLocation();
  const [images, setImages] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOwnerPaymentSetupOpen, setIsOwnerPaymentSetupOpen] = useState(false);
  const [listedItemTitle, setListedItemTitle] = useState("");
  const [showAIPricing, setShowAIPricing] = useState(false);
  const [showManualPricing, setShowManualPricing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  }, [user]);

  // Request notification permission when component mounts
  useEffect(() => {
    browserNotifications.requestPermission();
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      categoryId: 0,
      ownerId: 1, // Mock owner ID
      images: [],
      location: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      available: true,
      included: [],
      includedItems: "",
    },
  });

  const createItemMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: async (createdItem) => {
      const itemTitle = form.getValues("title");
      
      toast({
        title: "Success!",
        description: "Your item has been listed successfully.",
      });
      
      // Show browser notification
      browserNotifications.showListingPublishedNotification(itemTitle, createdItem.id);
      
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      
      // Check if user needs payment setup after listing their first item
      try {
        const statusResponse = await fetch("/api/payment-setup-status", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.needsPaymentSetup) {
            setIsOwnerPaymentSetupOpen(true);
            return; // Don't redirect yet, let user complete payment setup
          }
        }
      } catch (error) {
        console.error("Error checking payment setup status:", error);
      }
      
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to list your item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if user should be prompted for payment setup after listing item
  const checkIfShouldPromptPaymentSetup = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/payment-setup-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Show owner payment setup if user has items but no payment method configured
        if (data.hasItems && !data.paymentSetupComplete && !data.paypalConnected && !data.stripeAccountStatus?.payoutsEnabled) {
          setIsOwnerPaymentSetupOpen(true);
        } else {
          toast({
            title: "Item Listed Successfully!",
            description: "Your item is now available for rent.",
          });
          setLocation("/");
        }
      } else {
        setLocation("/");
      }
    } catch (error) {
      console.error('Failed to check payment setup status:', error);
      setLocation("/");
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to list an item.",
        variant: "destructive",
      });
      return;
    }

    if (!values.price) {
      toast({
        title: "Price Required",
        description: "Please set a price for your item.",
        variant: "destructive",
      });
      return;
    }

    const includedArray = values.includedItems
      ? values.includedItems.split('\n').filter(item => item.trim() !== '')
      : [];

    // Combine address fields into location for backward compatibility
    const fullAddress = `${values.address}, ${values.city}, ${values.state} ${values.zipCode}`;

    const itemData = {
      ...values,
      price: values.price.toString(),
      images: images,
      included: includedArray,
      categoryId: Number(values.categoryId),
      ownerId: user.id,
      location: fullAddress, // Combined address for backward compatibility
      availableFrom: values.availableFrom || null,
      availableTo: values.availableTo || null,
    };

    // Remove the helper fields
    delete (itemData as any).includedItems;
    delete (itemData as any).originalPrice;

    createItemMutation.mutate(itemData);
  };

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-dark mb-4">Login Required</h1>
              <p className="text-gray-medium mb-6">You need to be logged in to list items.</p>
              <Button onClick={() => setIsAuthModalOpen(true)} className="btn-primary text-white">
                Login or Register
              </Button>
            </div>
          </CardContent>
        </Card>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setLocation("/")} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-dark">List Your Item</CardTitle>
            <p className="text-gray-medium">Share the details about what you'd like to rent out</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-dark">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Canon EOS 5D Mark IV Camera"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your item in detail..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
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



                  {/* Address Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 123 Main Street"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., San Francisco"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 94105"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Privacy Protected</p>
                      <p className="text-blue-600">Your address will only be shared with renters after you approve their booking request. It remains private until then.</p>
                    </div>
                  </div>
                </div>
                </div>

                {/* Availability Dates */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-dark">Availability</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="availableFrom"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Available From</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick start date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="availableTo"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Available Until</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick end date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium">Flexible Availability</p>
                      <p className="text-green-600">Set when your item is available for rental. You can always update these dates later or leave them blank for open availability.</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-dark">Photos</h3>
                  
                  <ImageUpload
                    images={images}
                    onImagesChange={handleImagesChange}
                    maxImages={5}
                    maxSizeInMB={10}
                  />
                </div>

                {/* What's Included */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-dark">What's Included</h3>
                  
                  <FormField
                    control={form.control}
                    name="includedItems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Included Items</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List what comes with your rental (one item per line)&#10;e.g.,&#10;Extra batteries&#10;Memory card&#10;Carrying case"
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Pricing Choice */}
                {!showAIPricing && !showManualPricing && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-dark text-center">Choose Your Pricing Method</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        type="button"
                        onClick={() => setShowAIPricing(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 py-6"
                        disabled={!form.watch("title") || !form.watch("description") || !form.watch("address") || !form.watch("city") || !form.watch("state") || !form.watch("zipCode") || !form.watch("categoryId")}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span className="sm:hidden">Submit Info for AI Pricing Suggestions</span>
                        <span className="hidden sm:inline">Submit Information for Instant AI Pricing Suggestions</span>
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setShowManualPricing(true)}
                        variant="outline"
                        className="flex-1 py-6"
                      >
                        Enter Price Individually
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Fill out all item details above to enable AI pricing suggestions
                    </p>
                  </div>
                )}

                {/* AI Pricing Suggestions */}
                {showAIPricing && (
                  <AIPricingSuggestions
                    itemTitle={form.watch("title")}
                    category={categories.find(c => c.id === Number(form.watch("categoryId")))?.name || ""}
                    description={form.watch("description")}
                    location={`${form.watch("address")}, ${form.watch("city")}, ${form.watch("state")} ${form.watch("zipCode")}`}
                    condition="good"
                    onPriceSelect={(price) => {
                      form.setValue("price", price);
                    }}
                  />
                )}

                {/* Manual Pricing */}
                {showManualPricing && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rental Price per day ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="25.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Publish Button - appears after either pricing method is selected */}
                {(showAIPricing || showManualPricing) && (
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowAIPricing(false);
                          setShowManualPricing(false);
                          form.setValue("price", undefined);
                        }}
                      >
                        Back to Pricing Options
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createItemMutation.isPending || !form.watch("price")}
                        className="bg-primary-blue text-white hover:bg-primary-blue/90 px-8 py-3"
                      >
                        {createItemMutation.isPending ? "Publishing..." : "Publish Listing"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cancel Button (always visible) */}
                <div className="flex justify-center">
                  <Link href="/">
                    <Button type="button" variant="ghost" className="text-gray-500">
                      Cancel and Return Home
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="register"
      />

      <OwnerPaymentSetupModal
        isOpen={isOwnerPaymentSetupOpen}
        onClose={() => {
          setIsOwnerPaymentSetupOpen(false);
          setLocation("/");
        }}
        onComplete={() => {
          setIsOwnerPaymentSetupOpen(false);
          toast({
            title: "Payment Setup Complete!",
            description: "You're now ready to receive payments from your rentals.",
          });
          setLocation("/");
        }}
        itemTitle={listedItemTitle}
      />
    </div>
  );
}
