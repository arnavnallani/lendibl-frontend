import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface PaymentReminder {
  id: number;
  reminderType: "payout_blocked" | "approval_required" | "periodic";
  pendingAmount: string;
  reminderCount: number;
  lastSent: string;
  resolved: boolean;
}

interface PaymentSetupStatus {
  paymentSetupComplete: boolean;
  pendingEarnings: string;
  paymentReminders: PaymentReminder[];
  needsPaymentSetup: boolean;
  hasItems: boolean;
  estimatedEarnings: number;
}

export function usePaymentSetup() {
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<PaymentReminder | null>(null);

  const { data: paymentStatus, refetch } = useQuery<PaymentSetupStatus>({
    queryKey: ["/api/payment-setup-status"],
    refetchInterval: 30000, // Check every 30 seconds for new reminders
  });

  // Check for payment reminders and show modal
  useEffect(() => {
    if (paymentStatus?.paymentReminders && paymentStatus.paymentReminders.length > 0) {
      // Find the most urgent reminder
      const urgentReminder = paymentStatus.paymentReminders.find(r => r.reminderType === "approval_required") ||
                           paymentStatus.paymentReminders.find(r => r.reminderType === "payout_blocked") ||
                           paymentStatus.paymentReminders[0];
      
      if (urgentReminder && !showPaymentRequired) {
        setCurrentReminder(urgentReminder);
        setShowPaymentRequired(true);
      }
    }
  }, [paymentStatus?.paymentReminders, showPaymentRequired]);

  const handlePaymentSetupComplete = () => {
    setShowPaymentRequired(false);
    setCurrentReminder(null);
    refetch(); // Refresh status
  };

  const handleCloseReminder = () => {
    setShowPaymentRequired(false);
    setCurrentReminder(null);
  };

  return {
    paymentStatus,
    showPaymentRequired,
    currentReminder,
    handlePaymentSetupComplete,
    handleCloseReminder,
    refetchStatus: refetch
  };
}