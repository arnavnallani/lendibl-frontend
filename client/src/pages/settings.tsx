import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Save, ArrowLeft, Home, Settings as SettingsIcon, CreditCard, ExternalLink, CheckCircle, AlertCircle, DollarSign, Package, Building2, Camera, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@assets/lendibl_logo1_1750383971030.png";
import StripeDebitCardForm from "@/components/StripeDebitCardForm";

const settingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDebitCardForm, setShowDebitCardForm] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isRemovingCard, setIsRemovingCard] = useState(false);
  const [debitCardForm, setDebitCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Fetch payment setup status
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const response = await fetch('/api/payment-setup-status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Payment status data:', data);
          setPaymentStatus(data);
        } else {
          console.error('Failed to fetch payment status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch payment status:', error);
      }
    };

    if (user) {
      fetchPaymentStatus();
    }
  }, [user]);

  const onSubmit = async (values: SettingsFormData) => {
    setIsLoading(true);
    try {
      await api.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      
      toast({
        title: "Profile updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      // Convert to base64 for simple upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          const response = await fetch('/api/auth/update-avatar', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ avatar: base64Data }),
          });

          if (response.ok) {
            // Refresh user data
            window.location.reload();
            toast({
              title: "Avatar updated",
              description: "Your profile picture has been updated successfully.",
            });
          } else {
            throw new Error('Failed to update avatar');
          }
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to update profile picture. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
      setIsUploadingAvatar(false);
    }
    
    // Clear the input
    event.target.value = '';
  };



  const handleSetupStripe = async () => {
    setIsCreatingAccount(true);
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      console.log('Starting Stripe Connect setup...');
      
      const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Connect account response:', data);

      if (response.ok && data.success) {
        toast({
          title: "Account Created",
          description: "Opening Stripe setup window...",
        });

        // Open in new window with specific dimensions
        if (data.onboardingUrl) {
          const popup = window.open(
            data.onboardingUrl, 
            'stripe-connect', 
            'width=800,height=700,scrollbars=yes,resizable=yes,status=yes'
          );
          
          if (!popup) {
            // Fallback if popup blocked
            toast({
              title: "Popup Blocked",
              description: "Please allow popups and try again, or click here to continue",
            });
            window.location.href = data.onboardingUrl;
          } else {
            popup.focus();
          }
        }

        // Refresh status after delay
        setTimeout(async () => {
          try {
            const statusResponse = await fetch('/api/payment-setup-status', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setPaymentStatus(statusData);
            }
          } catch (error) {
            console.error('Status refresh error:', error);
          }
        }, 2000);

      } else {
        console.error('Setup failed:', data);
        toast({
          title: "Setup Failed", 
          description: data.message || "Failed to create Stripe account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        title: "Network Error",
        description: "Connection failed. Please check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleContinueOnboarding = (onboardingUrl: string) => {
    if (!onboardingUrl) return;
    
    // Open in new window with specific dimensions
    const popup = window.open(
      onboardingUrl, 
      'stripe-connect', 
      'width=800,height=700,scrollbars=yes,resizable=yes,status=yes'
    );
    
    if (!popup) {
      // Fallback if popup blocked
      toast({
        title: "Popup Blocked",
        description: "Please allow popups and try again",
        variant: "destructive"
      });
      window.location.href = onboardingUrl;
    } else {
      popup.focus();
      toast({
        title: "Continuing Setup",
        description: "Complete your bank account verification in the new window",
      });
    }
  };



  const handleRemoveDebitCard = async () => {
    setIsRemovingCard(true);
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/remove-debit-card', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Debit Card Removed",
          description: "Your debit card has been removed successfully.",
        });
        
        fetchPaymentStatus();
      } else {
        toast({
          title: "Failed to Remove Card",
          description: data.message || "Unable to remove debit card. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Remove debit card error:', error);
      toast({
        title: "Network Error",
        description: "Connection failed. Please check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingCard(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Settings Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span className="text-sm font-medium text-gray-dark">Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary-blue" />
            <h1 className="text-3xl font-bold text-gray-dark">Settings</h1>
          </div>
          <p className="text-gray-medium">Manage your account settings and personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 mb-4 cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-lg bg-primary-blue text-white">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mb-4" onClick={() => document.getElementById('avatar-upload')?.click()}>
                      {isUploadingAvatar ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Click to change profile picture</p>
                  <h3 className="font-semibold text-lg text-gray-dark">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-medium text-sm">{user.email}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-medium">Member since</span>
                    <span className="font-medium">2025</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-medium">Account type</span>
                    <span className="font-medium">Standard</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <p className="text-sm text-gray-medium">
                  Update your personal details and contact information
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field} 
                              disabled
                              className="bg-gray-50"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500">Email cannot be changed at this time</p>
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
                            <Input 
                              type="tel" 
                              placeholder="Enter your phone number" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="flex justify-between items-center pt-4">
                      <Link href="/my-profile">
                        <Button variant="outline" type="button">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Profile
                        </Button>
                      </Link>
                      <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Payment Setup Section */}
            {paymentStatus && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment & Earnings Setup
                  </CardTitle>
                  <p className="text-sm text-gray-medium">
                    Configure your payment methods to receive earnings from rentals
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-500 mb-2">
                    Debug: Has items: {paymentStatus.hasItems ? 'Yes' : 'No'}, PayPal configured: {paymentStatus.paypalConfigured ? 'Yes' : 'No'}
                  </div>
                  {paymentStatus.hasItems && (
                    <div className="space-y-4">
                      {/* Connect Account Status */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-dark">Stripe Connect Account</h4>
                            <p className="text-sm text-gray-medium">Required to receive rental payments</p>
                          </div>
                          {paymentStatus.stripeAccountStatus?.payoutsEnabled ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">Setup Required</span>
                            </div>
                          )}
                        </div>
                        
                        {paymentStatus.stripeAccountStatus?.payoutsEnabled ? (
                          <div className="space-y-2">
                            <p className="text-sm text-green-700">
                              Bank account connected and ready to receive real money transfers when rentals complete.
                            </p>
                            {paymentStatus.pendingEarnings !== "0" && (
                              <div className="text-sm">
                                <span className="text-gray-600">Pending earnings: </span>
                                <span className="font-medium text-primary-blue">
                                  ${paymentStatus.pendingEarnings}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Debit Card Option */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-medium text-green-900 mb-2">Debit Card (Instant Payouts)</h4>
                              <p className="text-sm text-green-700 mb-4">
                                Add your debit card for instant payouts within minutes of rental completion.
                              </p>
                              
                              {paymentStatus.hasDebitCard ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium text-green-700">Debit Card Connected</span>
                                  </div>
                                  <div className="bg-white rounded p-3 border">
                                    <div className="text-sm">
                                      <div className="mb-1">
                                        <span className="font-medium">Card: </span>
                                        <span className="text-gray-600">
                                          {paymentStatus.debitCard?.brand?.toUpperCase()} •••• {paymentStatus.debitCard?.last4}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Expires: {String(paymentStatus.debitCard?.expMonth).padStart(2, '0')}/{paymentStatus.debitCard?.expYear}
                                      </div>
                                    </div>
                                    <Button 
                                      onClick={handleRemoveDebitCard}
                                      variant="outline"
                                      size="sm"
                                      className="mt-3 text-red-600 border-red-200 hover:bg-red-50"
                                      disabled={isRemovingCard}
                                    >
                                      {isRemovingCard ? 'Removing...' : 'Remove Card'}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {!showDebitCardForm ? (
                                    <Button 
                                      onClick={() => setShowDebitCardForm(true)}
                                      className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Add Debit Card
                                    </Button>
                                  ) : (
                                    <StripeDebitCardForm 
                                      onSuccess={() => {
                                        setShowDebitCardForm(false);
                                        fetchPaymentStatus();
                                        toast({
                                          title: "Debit Card Added",
                                          description: "Your debit card has been added successfully for instant payouts.",
                                        });
                                      }}
                                      onCancel={() => setShowDebitCardForm(false)}
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* OR Divider */}
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                              </div>
                              <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">OR</span>
                              </div>
                            </div>

                            {/* Bank Account Option */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2">Bank Account Connection</h4>
                              <p className="text-sm text-blue-700 mb-4">
                                Connect your bank account to receive payments when rentals complete.
                              </p>
                              
                              {!paymentStatus.stripeAccountStatus ? (
                                <Button 
                                  onClick={handleSetupStripe}
                                  disabled={isCreatingAccount}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  {isCreatingAccount ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Creating Account...
                                    </>
                                  ) : (
                                    <>
                                      <Building2 className="w-4 h-4 mr-2" />
                                      Connect Bank Account
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-700">Bank Account Setup Started</span>
                                  </div>
                                  {paymentStatus.stripeAccountStatus && (
                                    <div className="bg-white rounded p-3 border">
                                      <div className="text-sm">
                                        <div className="mb-1">
                                          <span className="font-medium">Status: </span>
                                          <span className={paymentStatus.stripeAccountStatus.payoutsEnabled ? 'text-green-600' : 'text-orange-600'}>
                                            {paymentStatus.stripeAccountStatus.payoutsEnabled ? 'Ready for Payouts' : 'Verification Required'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Account ID: {paymentStatus.stripeAccountStatus.accountId}
                                        </div>
                                      </div>
                                      
                                      {!paymentStatus.stripeAccountStatus.payoutsEnabled && paymentStatus.onboardingUrl && (
                                        <div className="mt-3">
                                          <Button 
                                            onClick={() => handleContinueOnboarding(paymentStatus.onboardingUrl)}
                                            size="sm"
                                            className="w-full bg-orange-600 hover:bg-orange-700"
                                          >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Continue Setup
                                          </Button>
                                          <p className="text-xs text-gray-500 mt-2">
                                            Complete your bank account verification to receive payments
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Earnings Summary */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-800">Earnings Overview</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Active Listings</span>
                            <p className="font-medium text-blue-800">{paymentStatus.hasItems ? 'Yes' : 'None'}</p>
                          </div>
                          <div>
                            <span className="text-blue-600">Estimated Monthly</span>
                            <p className="font-medium text-blue-800">$50</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!paymentStatus.hasItems && (
                    <div className="space-y-4">
                      <div className="text-center py-6">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-600 mb-2">No Items Listed</h4>
                        <p className="text-sm text-gray-500 mb-4">
                          List items to start earning and set up payment processing.
                        </p>
                        <Link href="/my-profile">
                          <Button variant="outline">Add Your First Item</Button>
                        </Link>
                      </div>
                      

                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <p className="text-sm text-gray-medium">
                  Actions that will affect your account permanently
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-800">Sign out of your account</h4>
                    <p className="text-sm text-red-600">You'll need to sign in again to access your account</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={logout}
                    className="ml-4"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}