import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface OwnerPaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  itemTitle: string;
}

export default function OwnerPaymentSetupModal({
  isOpen,
  onClose,
  onComplete,
  itemTitle
}: OwnerPaymentSetupModalProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  // Fetch payment status when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchPaymentStatus();
    }
  }, [isOpen]);

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
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
    }
  };

  const handleConnectPayPal = async () => {
    const message = `Enter your PayPal email address to receive payments:

Note: You must have an existing PayPal account with this email.
Don't have PayPal? Sign up free at paypal.com first.`;
    
    const paypalEmail = prompt(message);
    
    if (!paypalEmail || !paypalEmail.trim()) {
      return;
    }

    setIsConnecting(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/connect-paypal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paypalEmail: paypalEmail.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "PayPal Connected!",
          description: `Your PayPal account (${data.paypalEmail}) is now connected and ready for payouts.`,
        });
        onComplete();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect PayPal');
      }
    } catch (error: any) {
      console.error('PayPal connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect PayPal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateStripeAccount = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.onboardingUrl) {
          window.open(data.onboardingUrl, '_blank');
          toast({
            title: "Stripe Setup Started",
            description: "Complete the business verification in the new window.",
          });
        }
      } else {
        throw new Error('Failed to create Stripe account');
      }
    } catch (error) {
      console.error('Stripe account creation error:', error);
      toast({
        title: "Setup Failed",
        description: "Unable to create Stripe account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipForNow = () => {
    toast({
      title: "Payment Setup Skipped",
      description: "You can set up payments anytime in Settings to start receiving earnings.",
    });
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            Great! Your item "{itemTitle}" is now listed
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Ready to Start Earning!
            </h3>
            <p className="text-gray-600">
              Set up how you'd like to receive payments when people rent your items.
            </p>
          </div>

          {paymentStatus?.paypalConfigured && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Choose Your Payment Method:</h4>
              
              {/* PayPal Option */}
              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-bold">
                        P
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">PayPal</h5>
                        <p className="text-sm text-gray-600">Simple setup with your existing PayPal account</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Recommended
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Quick 2-minute setup</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Direct payments to your PayPal account</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>No additional verification required</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Requires existing PayPal account • <a href="https://paypal.com" target="_blank" className="text-blue-600 hover:underline">Sign up free</a>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Real payouts processed manually by Lendibl team
                    </div>
                  </div>
                  <Button 
                    onClick={handleConnectPayPal}
                    disabled={isConnecting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect PayPal Account'}
                  </Button>
                </CardContent>
              </Card>

              {/* Stripe Connect Option */}
              <Card className="border hover:border-gray-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-purple-600" />
                      <div>
                        <h5 className="font-medium text-gray-800">Stripe Connect</h5>
                        <p className="text-sm text-gray-600">Professional business account with bank transfers</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      More Setup
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span>Requires business verification</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Direct bank account deposits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Professional payment processing</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCreateStripeAccount}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full"
                  >
                    {isConnecting ? 'Creating Account...' : 'Setup Stripe Connect'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleSkipForNow}
              className="text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </Button>
            <div className="text-sm text-gray-500">
              You can set this up later in{' '}
              <Link href="/settings">
                <span className="text-blue-600 hover:underline cursor-pointer">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}