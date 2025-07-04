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
import { User, Save, ArrowLeft, Home, Settings as SettingsIcon, CreditCard, ExternalLink, CheckCircle, AlertCircle, DollarSign, Package, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@assets/lendibl_logo1_1750383971030.png";

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
              <span className="text-sm font-medium text-blue-900">Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="group relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <SettingsIcon className="h-8 w-8 text-sky-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">Settings</h1>
              </div>
              <p className="text-blue-600">Manage your account settings and personal information</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-600/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <User className="h-5 w-5 text-sky-600" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-blue-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sky-600 text-sm">{user.email}</p>
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
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-sm font-medium text-green-700">Bank Account Connected</span>
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