import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Edit3, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const updatePaymentSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be at least 16 digits"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().min(3, "CVV must be at least 3 digits"),
  cardholderName: z.string().min(2, "Cardholder name is required"),
});

type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;

interface PaymentMethodInfo {
  hasPaymentMethod: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export default function PaymentMethodCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: paymentMethod, isLoading } = useQuery<PaymentMethodInfo>({
    queryKey: ["/api/payment-method"],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: UpdatePaymentFormData) => {
      const response = await fetch("/api/payment-method", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update payment method");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsUpdating(false);
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method"] });
      setShowUpdateForm(false);
      reset();
    },
    onError: (error: Error) => {
      setIsUpdating(false);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/payment-method", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove payment method");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-setup-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UpdatePaymentFormData) => {
    setIsUpdating(true);
    updatePaymentMutation.mutate(data);
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const getCardBrandIcon = (brand?: string) => {
    // You could add specific brand icons here
    return <CreditCard className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentMethod?.hasPaymentMethod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            No payment method on file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Add a payment method to receive rental earnings.
          </p>
          <Button 
            onClick={() => setShowUpdateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCardBrandIcon(paymentMethod.card?.brand)}
              <div>
                <div className="font-medium">
                  {paymentMethod.card?.brand?.toUpperCase()} •••• {paymentMethod.card?.last4}
                </div>
                <div className="text-sm text-gray-600">
                  Expires {paymentMethod.card?.expMonth?.toString().padStart(2, '0')}/{paymentMethod.card?.expYear}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUpdateForm(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => removePaymentMutation.mutate()}
                disabled={removePaymentMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Payment Method Modal */}
      <Dialog open={showUpdateForm} onOpenChange={setShowUpdateForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
          </DialogHeader>
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
                onClick={() => {
                  setShowUpdateForm(false);
                  reset();
                }} 
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}