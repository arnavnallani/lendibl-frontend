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
        setError(confirmError.message || "Payment failed");
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!', paymentIntent);
        onSuccess();
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
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center pb-4 border-b">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              ${amount.toFixed(2)}
            </div>
            <p className="text-gray-600 text-sm">
              {itemTitle}
            </p>
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