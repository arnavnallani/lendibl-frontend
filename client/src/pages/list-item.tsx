import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, X, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import AuthModal from "@/components/auth-modal";
import OwnerPaymentSetupModal from "@/components/owner-payment-setup-modal";
import Footer from "@/components/footer";
import { AIPricingSuggestions } from "@/components/ai-pricing-suggestions";

const formSchema = insertItemSchema.extend({
  price: z.coerce.number().min(0, "Price must be a positive number").optional(),
  categoryId: z.coerce.number().min(1, "Category is required"),
  includedItems: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ListItem() {
  const [, setLocation] = useLocation();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
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
      available: true,
      included: [],
      includedItems: "",

    },
  });

  const createItemMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: async () => {
      toast({
        title: "Success!",
        description: "Your item has been listed successfully.",
      });
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
            setPaymentSetupData(statusData);
            setIsPaymentSetupOpen(true);
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

    const itemData = {
      ...values,
      price: values.price.toString(),
      images: imageUrls,
      included: includedArray,
      categoryId: Number(values.categoryId),
      ownerId: user.id,
    };

    // Remove the helper fields
    delete (itemData as any).includedItems;
    delete (itemData as any).originalPrice;

    createItemMutation.mutate(itemData);
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      setImageUrls(prev => [...prev, url.trim()]);
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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



                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., San Francisco, CA"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Images */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-dark">Photos</h3>
                  
                  <div className="border-2 border-dashed border-gray-light rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-medium mb-4" />
                    <p className="text-gray-medium mb-4">Add photos of your item</p>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleImageUrlAdd}
                    >
                      Add Image URL
                    </Button>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`Item image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImageUrl(index)}
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

                {/* Pricing Choice */}
                {!showAIPricing && !showManualPricing && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-dark text-center">Choose Your Pricing Method</h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        type="button"
                        onClick={() => setShowAIPricing(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1 py-6"
                        disabled={!form.watch("title") || !form.watch("description") || !form.watch("location") || !form.watch("categoryId")}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Submit Information for Instant AI Pricing Suggestions
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setShowManualPricing(true)}
                        variant="outline"
                        className="flex-1 py-6"
                      >
                        Enter Price Manually
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
                    location={form.watch("location")}
                    condition="good"
                    onPriceSelect={(price) => {
                      form.setValue("price", price);
                      // Auto-submit form after price selection
                      setTimeout(() => {
                        form.handleSubmit(onSubmit)();
                      }, 1000);
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
                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowManualPricing(false)}
                      >
                        Back to Pricing Options
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createItemMutation.isPending || !form.watch("price")}
                        className="bg-primary-blue text-white hover:bg-primary-blue/90"
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
