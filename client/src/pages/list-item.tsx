import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Calendar, Camera, RotateCcw, Eye, Play, ImageIcon, MapPin, DollarSign, Tag } from "lucide-react";
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
import { Upload, X, Scan } from "lucide-react";
import MobileImageScanner from "@/components/mobile-image-scanner";
import { AddressAutofill } from "@/components/AddressAutofill";

const formSchema = insertItemSchema.extend({
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  currentPrice: z.coerce.string().optional().transform((val) => val === "" ? null : val),
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

  // Image upload handlers
  const handleImageUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxFiles = 8;
    
    if (images.length + fileArray.length > maxFiles) {
      toast({
        title: "Too many images",
        description: `You can upload up to ${maxFiles} images`,
        variant: "destructive",
      });
      return;
    }

    fileArray.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOwnerPaymentSetupOpen, setIsOwnerPaymentSetupOpen] = useState(false);
  const [listedItemTitle, setListedItemTitle] = useState("");
  const [showAIPricing, setShowAIPricing] = useState(false);
  const [showManualPricing, setShowManualPricing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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
      price: 1,
      currentPrice: "",
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
      availableFrom: undefined,
      availableTo: undefined,
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
    console.log("Form submission started", values);
    
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

    console.log("All validations passed, proceeding with submission");

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/15 to-blue-50/25 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 -right-20 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-slate-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/5 to-slate-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Navigation Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3 hover:scale-105 transition-all duration-300">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-gray-700 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <ArrowLeft className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-cyan-500 transition-colors duration-300">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-gray-700 rounded-full shadow-lg">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <span className="text-white font-medium text-sm">Create Listing</span>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-200 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            <span className="text-cyan-700 font-medium text-sm">Turn Your Items Into Income</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight">
            List Your Item
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">Make money off your items... and get them back in no time</p>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 via-blue-700 to-slate-900 p-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  {/* Basic Information Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-gradient-to-br from-cyan-500 to-gray-700 rounded-2xl shadow-lg">
                        <span className="text-white font-bold text-lg">1</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
                        <p className="text-gray-600">Tell us about your item</p>
                      </div>
                    </div>
                  
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
                          <AddressAutofill
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Start typing your address..."
                            onAddressSelect={(addressData) => {
                              console.log('Setting form values:', addressData);
                              form.setValue("address", addressData.streetAddress);
                              form.setValue("city", addressData.city);
                              form.setValue("state", addressData.state);
                              form.setValue("zipCode", addressData.zipCode);
                              
                              // Trigger form validation/updates
                              form.trigger(["city", "state", "zipCode"]);
                            }}
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                  {/* Current Real Price of Item */}
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Real Price of Item ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="1500.00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          What would this item cost to buy new today? This helps AI give more accurate pricing suggestions.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-start space-x-2 mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="w-4 h-4 bg-cyan-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="text-sm text-cyan-700">
                      <p className="font-medium">Privacy Protected</p>
                      <p className="text-cyan-600">Your address will only be shared with renters after you approve their booking request. It remains private until then.</p>
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

                {/* Photos Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Item Photos</h3>
                      <p className="text-gray-600">Show off your item with stunning visuals</p>
                    </div>
                  </div>
                  
                  {/* Image Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop images here, click to upload, or click to scan the item right here</p>
                    <p className="text-sm text-gray-500 mb-4">
                      PNG, JPG, GIF up to 10MB each (max 8 images)
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="relative"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowScanner(true)}
                        className="relative"
                      >
                        <Scan className="h-4 w-4 mr-2" />
                        Scan Item
                      </Button>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleImageUpload(e.target.files);
                        }
                      }}
                    />
                  </div>

                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Item photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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

                {/* Pricing Section */}
                {!showAIPricing && !showManualPricing && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Set Your Price</h3>
                        <p className="text-gray-600">Choose how to price your item</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* AI Pricing Card */}
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-gray-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-cyan-200 transition-all duration-300 h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-cyan-500 to-gray-700 rounded-xl">
                              <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">AI Smart Pricing</h4>
                              <p className="text-sm text-cyan-600 font-medium">Recommended</p>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-6">
                            Get intelligent pricing suggestions based on market data, demand patterns, and seasonal trends
                          </p>
                          <ul className="space-y-2 mb-6 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                              Market analysis
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                              Demand forecasting
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                              Seasonal adjustments
                            </li>
                          </ul>
                          <Button 
                            type="button"
                            onClick={() => setShowAIPricing(true)}
                            className="w-full bg-gradient-to-r from-cyan-500 to-gray-700 hover:from-cyan-600 hover:to-gray-800 text-white rounded-xl py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                            disabled={!form.watch("title") || !form.watch("description") || !form.watch("address") || !form.watch("city") || !form.watch("state") || !form.watch("zipCode") || !form.watch("categoryId")}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Get AI Suggestions
                          </Button>
                        </div>
                      </div>

                      {/* Manual Pricing Card */}
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-gray-200 transition-all duration-300 h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">Manual Pricing</h4>
                              <p className="text-sm text-gray-600 font-medium">Traditional</p>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-6">
                            Set your own price based on your knowledge and research of the market
                          </p>
                          <ul className="space-y-2 mb-6 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              Full control
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              Your expertise
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              Instant setup
                            </li>
                          </ul>
                          <Button 
                            type="button"
                            onClick={() => setShowManualPricing(true)}
                            variant="outline"
                            className="w-full border-2 border-gray-300 hover:border-gray-400 rounded-xl py-3 font-medium transition-all duration-300"
                          >
                            Set Price Manually
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {(!form.watch("title") || !form.watch("description") || !form.watch("address") || !form.watch("city") || !form.watch("state") || !form.watch("zipCode") || !form.watch("categoryId")) && (
                      <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div className="text-sm text-amber-700">
                          <p className="font-medium">Complete item details first</p>
                          <p className="text-amber-600">Fill out all basic information and location details above to enable AI pricing suggestions.</p>
                        </div>
                      </div>
                    )}
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
                    currentPrice={(() => {
                      const val = form.watch("currentPrice");
                      return val ? parseFloat(val) : undefined;
                    })()}
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
                          form.setValue("price", 1);
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
            </div>
          </div>
        </div>
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
      {/* Mobile Image Scanner */}
      {showScanner && (
        <MobileImageScanner
          onCapture={(scannedImages) => {
            setImages(prev => [...prev, ...scannedImages]);
            setShowScanner(false);
            toast({
              title: "Photos Captured!",
              description: `Added ${scannedImages.length} enhanced photos to your listing.`,
            });
          }}
          onClose={() => setShowScanner(false)}
          maxImages={8 - images.length}
        />
      )}
    </div>
  );
}
