import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeDebitCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DebitCardForm: React.FC<StripeDebitCardFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method with Stripe Elements
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        toast({
          title: "Card Error",
          description: error.message || "Invalid card information",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Check if it's a debit card
      if (paymentMethod.card?.funding !== 'debit') {
        toast({
          title: "Credit Card Not Supported",
          description: "Only debit cards are supported for payouts. Please use a debit card instead.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Send payment method to backend
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/add-debit-card', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        toast({
          title: "Failed to Add Card",
          description: data.message || "Unable to add debit card. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding debit card:', error);
      toast({
        title: "Network Error",
        description: "Connection failed. Please check your network and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Debit Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
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
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Only debit cards are supported for instant payouts. Your card information is securely processed by Stripe.
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding Card...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Debit Card
            </>
          )}
        </Button>
        <Button 
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const StripeDebitCardForm: React.FC<StripeDebitCardFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <DebitCardForm {...props} />
    </Elements>
  );
};

export default StripeDebitCardForm;