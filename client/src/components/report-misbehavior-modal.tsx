import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Send, User, Package, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BookingWithDetails } from "@shared/schema";

interface ReportMisbehaviorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental?: BookingWithDetails;
  userRole: 'owner' | 'renter';
}

export default function ReportMisbehaviorModal({ 
  isOpen, 
  onClose, 
  rental,
  userRole 
}: ReportMisbehaviorModalProps) {
  const { toast } = useToast();
  const [reportData, setReportData] = useState({
    incidentType: '',
    description: '',
    contactEmail: '',
    agreesToTerms: false
  });

  const incidentTypes = userRole === 'owner' 
    ? [
        'Item returned damaged',
        'Item returned late',
        'Item not returned',
        'Renter violated terms',
        'Inappropriate behavior',
        'Other'
      ]
    : [
        'Item not as described',
        'Item was damaged/broken',
        'Owner was unresponsive',
        'Pickup/return issues',
        'Inappropriate behavior',
        'Other'
      ];



  const submitReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      return api.submitMisbehaviorReport(reportData);
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your report has been sent to disputes@lendibl.com for review.",
      });
      onClose();
      setReportData({
        incidentType: '',
        description: '',
        contactEmail: '',
        agreesToTerms: false
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!reportData.incidentType || !reportData.description || 
        !reportData.contactEmail || !reportData.agreesToTerms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and agree to the terms.",
        variant: "destructive",
      });
      return;
    }

    const fullReportData = {
      ...reportData,
      rentalId: rental?.id,
      itemTitle: rental?.item.title,
      reporterRole: userRole,
      submittedAt: new Date().toISOString()
    };

    submitReportMutation.mutate(fullReportData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="report-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Report Misbehavior
          </DialogTitle>
        </DialogHeader>
        <div id="report-modal-description" className="sr-only">
          Report issues or inappropriate behavior during the rental process
        </div>
        
        <div className="space-y-6">
          {/* Rental Information */}
          {rental && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Rental Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>{rental.item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{userRole === 'owner' ? rental.renter.username : rental.item.owner.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>${rental.totalPrice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Report Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="incident-type">Type of Incident *</Label>
              <Select 
                value={reportData.incidentType} 
                onValueChange={(value) => setReportData({...reportData, incidentType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            <div>
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide a detailed description of what happened, including dates, times, and any relevant details..."
                value={reportData.description}
                onChange={(e) => setReportData({...reportData, description: e.target.value})}
                className="min-h-[120px]"
              />
            </div>



            <div>
              <Label htmlFor="contact-email">Your Contact Email *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="your.email@example.com"
                value={reportData.contactEmail}
                onChange={(e) => setReportData({...reportData, contactEmail: e.target.value})}
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms-agreement"
                checked={reportData.agreesToTerms}
                onCheckedChange={(checked) => setReportData({...reportData, agreesToTerms: !!checked})}
              />
              <Label htmlFor="terms-agreement" className="text-sm leading-5">
                I agree that this report is accurate and submitted in good faith. I understand that false reports may result in account suspension. *
              </Label>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important Notice</p>
                <p className="text-yellow-700 mt-1">
                  This report will be sent to disputes@lendibl.com for review. Our team will investigate and contact both parties if needed. Please provide accurate and detailed information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitReportMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitReportMutation.isPending ? 'Submitting...' : 'Send Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}