import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SimplePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemTitle: string;
  onConfirm: () => void;
}

export default function SimplePaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  itemTitle, 
  onConfirm 
}: SimplePaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${amount.toFixed(2)}
            </div>
            <p className="text-gray-600 text-sm">
              Payment for: {itemTitle}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Pay Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}