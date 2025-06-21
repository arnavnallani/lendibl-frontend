import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemTitle: string;
  clientSecret: string;
  onSuccess: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Detect if we're in test mode based on the public key
const isTestMode = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_');

function PaymentForm({ amount, onSuccess, onCancel, clientSecret }: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setIsLoading(false);
      return;
    }

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (confirmError) {
        let errorMessage = confirmError.message || "Payment failed";
        
        // Provide helpful error messages based on mode
        if (confirmError.code === 'card_declined') {
          if (import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_')) {
            errorMessage = "Test mode: Please use test card 4242 4242 4242 4242 with any future date and CVC";
          } else {
            errorMessage = "Card declined. Please check your card details and try again.";
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
        console.log('Payment confirmed!', paymentIntent.id, 'Status:', paymentIntent.status);
        onSuccess();
      } else {
        console.log('Payment intent status:', paymentIntent?.status);
        setError("Payment was not completed successfully");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="border rounded-lg p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#dc2626',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Your payment information is secure and encrypted
        </p>
        {(import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_') || import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('rk_test_')) && (
          <div className="text-xs bg-blue-50 p-2 rounded">
            <strong>Test Mode:</strong> Use test card 4242 4242 4242 4242 with any future date and CVC
          </div>
        )}
        {(import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_') || import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('rk_live_')) && (
          <div className="text-xs bg-green-50 p-2 rounded">
            <strong>Live Mode:</strong> Real credit cards will be charged
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!stripe || isLoading}
        >
          {isLoading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

export default function SimplePaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  itemTitle, 
  clientSecret,
  onSuccess
}: PaymentModalProps) {
  if (!clientSecret) {
    return null;
  }

  // Check if this is a free item
  const isFree = amount === 0 || clientSecret.includes('_secret_mock');
  const isLiveMode = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_');
  const isTestMode = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_');

  if (isFree) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Free Booking</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center pb-4 border-b">
              <div className="text-3xl font-bold text-green-600 mb-2">
                FREE
              </div>
              <div className="text-gray-600">{itemTitle}</div>
            </div>

            <p className="text-sm text-gray-600 text-center">
              This item is free to rent. Click confirm to proceed with your booking request.
            </p>
            
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={onSuccess}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Free Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center pb-4 border-b">
            <div className={`text-2xl font-bold mb-1 ${isLiveMode ? 'text-green-600' : 'text-blue-600'}`}>
              ${amount.toFixed(2)}
            </div>
            <p className="text-gray-600 text-sm">
              {itemTitle}
            </p>
            {isLiveMode && (
              <p className="text-green-700 text-xs font-medium mt-1">
                Live Payment - Card will be charged
              </p>
            )}
          </div>
          
          <Elements stripe={stripePromise}>
            <PaymentForm 
              amount={amount}
              onSuccess={onSuccess}
              onCancel={onClose}
              clientSecret={clientSecret}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
}