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

const paymentSetupSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be at least 16 digits"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().min(3, "CVV must be at least 3 digits"),
  cardholderName: z.string().min(2, "Cardholder name is required"),
});

type PaymentSetupFormData = z.infer<typeof paymentSetupSchema>;

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  estimatedEarnings?: number;
}

export default function PaymentSetupModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  estimatedEarnings = 250 
}: PaymentSetupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentSetupFormData>({
    resolver: zodResolver(paymentSetupSchema),
  });

  const setupPaymentMutation = useMutation({
    mutationFn: async (data: PaymentSetupFormData) => {
      const response = await fetch("/api/setup-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to setup payment method");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Setup Complete!",
        description: "You're now ready to receive payments from your rentals.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      reset();
      onComplete();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: PaymentSetupFormData) => {
    setIsProcessing(true);
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setupPaymentMutation.mutate(data);
    setIsProcessing(false);
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Start Earning from Your Rentals!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto" />
                <CardTitle className="text-lg text-center">Earn Money</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Estimated monthly earnings: <span className="font-bold text-green-600">${estimatedEarnings}</span>
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <Clock className="w-8 h-8 text-blue-600 mx-auto" />
                <CardTitle className="text-lg text-center">Fast Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Receive payments 24 hours after rental ends
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <Shield className="w-8 h-8 text-blue-600 mx-auto" />
                <CardTitle className="text-lg text-center">Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Bank-level security with Stripe payment processing
                </CardDescription>
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
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    {...register("cardNumber")}
                    onChange={(e) => {
                      e.target.value = formatCardNumber(e.target.value);
                      register("cardNumber").onChange(e);
                    }}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-600">{errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      maxLength={5}
                      {...register("expiryDate")}
                      onChange={(e) => {
                        e.target.value = formatExpiryDate(e.target.value);
                        register("expiryDate").onChange(e);
                      }}
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-red-600">{errors.expiryDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      {...register("cvv")}
                    />
                    {errors.cvv && (
                      <p className="text-sm text-red-600">{errors.cvv.message}</p>
                    )}
                  </div>
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
                    disabled={isProcessing}
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
      </DialogContent>
    </Dialog>
  );
}