import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  itemTitle: string;
}

export default function PaymentForm({ onSuccess, onCancel, amount, itemTitle }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('PaymentForm rendered with:', { stripe: !!stripe, elements: !!elements, amount, itemTitle });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payment form submitted');

    if (!stripe || !elements) {
      console.log('Stripe or elements not available');
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the payment form to get payment method
      console.log('Submitting payment elements');
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Elements submit error:', submitError);
        toast({
          title: "Payment Failed",
          description: submitError.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Confirm payment without redirect
      console.log('Confirming payment');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      console.log('Payment confirmation result:', { error, paymentIntent });
      setIsProcessing(false);

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded, calling onSuccess');
        toast({
          title: "Payment Successful",
          description: `Your reservation for ${itemTitle} has been confirmed!`,
        });
        onSuccess();
      } else {
        console.log('Payment processing, calling onSuccess');
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed.",
        });
        onSuccess();
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount:</span>
          <span className="text-xl font-bold text-primary-blue">${amount.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-medium mt-1">
          This amount will be held until the owner approves your request
        </p>
      </div>
      
      <PaymentElement />
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="flex-1 bg-primary-blue hover:bg-primary-blue/90"
        >
          {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}