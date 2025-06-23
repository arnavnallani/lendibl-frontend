import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, DollarSign, Clock } from "lucide-react";
import PaymentSetupModal from "./payment-setup-modal";

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerType: "approval_required" | "payout_blocked" | "periodic";
  pendingAmount: string;
  onPaymentSetupComplete: () => void;
}

export default function PaymentRequiredModal({ 
  isOpen, 
  onClose, 
  triggerType,
  pendingAmount,
  onPaymentSetupComplete
}: PaymentRequiredModalProps) {
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);

  const getTitleAndMessage = () => {
    switch (triggerType) {
      case "approval_required":
        return {
          title: "Payment Setup Required to Approve Rental",
          message: "Before you can approve this rental request, we need your payment information to send you earnings.",
          urgency: "high"
        };
      case "payout_blocked":
        return {
          title: "Complete Payment Setup to Receive Earnings",
          message: "You have pending earnings that we can't send until you complete your payment setup.",
          urgency: "high"
        };
      case "periodic":
        return {
          title: "Don't Miss Out on Your Earnings",
          message: "You still have pending earnings waiting. Complete your payment setup to start receiving payments.",
          urgency: "medium"
        };
      default:
        return {
          title: "Payment Setup Required",
          message: "Complete your payment setup to continue.",
          urgency: "medium"
        };
    }
  };

  const { title, message, urgency } = getTitleAndMessage();

  const handleSetupPayment = () => {
    setShowPaymentSetup(true);
  };

  const handlePaymentSetupComplete = () => {
    setShowPaymentSetup(false);
    onPaymentSetupComplete();
    onClose();
  };

  if (showPaymentSetup) {
    return (
      <PaymentSetupModal
        isOpen={true}
        onClose={() => setShowPaymentSetup(false)}
        onComplete={handlePaymentSetupComplete}
        estimatedEarnings={parseFloat(pendingAmount)}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className={`w-6 h-6 ${urgency === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pending Amount Display */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Pending Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${parseFloat(pendingAmount).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Ready to be sent to your account
              </p>
            </CardContent>
          </Card>

          {/* Message */}
          <div className="text-center space-y-3">
            <p className="text-gray-700">{message}</p>
            
            {triggerType === "approval_required" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Rental approval is paused</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  The renter is waiting for your response. Complete payment setup to approve their request.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              {triggerType === "approval_required" ? "Cancel" : "Remind Me Later"}
            </Button>
            <Button 
              onClick={handleSetupPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Setup Payment
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-gray-500 text-center">
            Your payment information is securely encrypted and only used to send you rental earnings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}