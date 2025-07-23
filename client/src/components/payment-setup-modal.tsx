import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Clock, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const paymentSetupSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required").max(100, "Name too long"),
});

type PaymentSetupFormData = z.infer<typeof paymentSetupSchema>;

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  estimatedEarnings?: number;
}

// Payment form component that uses Stripe Elements
function PaymentSetupForm({ onComplete, onClose, estimatedEarnings }: {
  onComplete: () => void;
  onClose: () => void;
  estimatedEarnings: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentSetupFormData>({
    resolver: zodResolver(paymentSetupSchema),
  });

  const setupPaymentMutation = useMutation({
    mutationFn: async (data: { paymentMethodId: string; cardholderName: string }) => {
      const response = await fetch("/api/setup-payment-with-stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to setup payment method");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsProcessing(false);
      toast({
        title: "Payment Setup Complete!",
        description: "You're now ready to receive payments from your rentals.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-setup-status"] });
      reset();
      onComplete();
      onClose();
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PaymentSetupFormData) => {
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe has not loaded properly. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Card information is required.",
        variant: "destructive",
      });
      return;
    }

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: data.cardholderName,
      },
    });

    if (error) {
      setIsProcessing(false);
      toast({
        title: "Invalid Card",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Send payment method to backend
    setupPaymentMutation.mutate({
      paymentMethodId: paymentMethod.id,
      cardholderName: data.cardholderName,
    });
  };

  return (
    <div className="space-y-6">
      {/* Earnings Preview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <DollarSign className="w-8 h-8 text-blue-600 mx-auto" />
            <CardTitle className="text-lg text-center">Potential Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 text-center">${estimatedEarnings}</div>
            <CardDescription className="text-center">Per month</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <Clock className="w-8 h-8 text-green-600 mx-auto" />
            <CardTitle className="text-lg text-center">Fast Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 text-center">24h</div>
            <CardDescription className="text-center">After rental ends</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <Shield className="w-8 h-8 text-purple-600 mx-auto" />
            <CardTitle className="text-lg text-center">Secure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 text-center">100%</div>
            <CardDescription className="text-center">Bank-level security</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            We need your payment details to send you rental earnings. Your information is securely encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                {...register("cardholderName")}
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-600">{errors.cardholderName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Card Information</Label>
              <div className="border rounded-md p-4 bg-white min-h-[50px] relative">
                <CardElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        lineHeight: '24px',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#dc2626',
                        iconColor: '#dc2626',
                      },
                      complete: {
                        color: '#16a34a',
                        iconColor: '#16a34a',
                      },
                    },
                    hidePostalCode: true,
                  }}
                  onChange={(event) => {
                    setCardError(event.error ? event.error.message : null);
                    setCardComplete(event.complete);
                  }}
                />
              </div>
              {cardError && (
                <p className="text-sm text-red-600">{cardError}</p>
              )}
              {!cardError && (
                <p className="text-sm text-gray-500">Enter your card number, expiry date, and CVC</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={isProcessing}
              >
                Skip for Now
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isProcessing || !stripe || !cardComplete}
              >
                {isProcessing ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600 text-center">
        By completing payment setup, you agree to our Terms of Service and Payment Processing Agreement.
      </p>
    </div>
  );
}

export default function PaymentSetupModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  estimatedEarnings = 250 
}: PaymentSetupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Start Earning from Your Rentals!
          </DialogTitle>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <PaymentSetupForm 
            onComplete={onComplete}
            onClose={onClose}
            estimatedEarnings={estimatedEarnings}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}