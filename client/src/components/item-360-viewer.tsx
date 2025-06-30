import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  User,
  Camera,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ItemScan, Booking } from "@shared/schema";

interface Item360ViewerProps {
  bookingId: number;
  onClose: () => void;
}

interface ScanWithUser extends ItemScan {
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export function Item360Viewer({ bookingId, onClose }: Item360ViewerProps) {
  const [scans, setScans] = useState<ScanWithUser[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanWithUser | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [showGoodReport, setShowGoodReport] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScans();
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await apiRequest("GET", `/api/bookings/${bookingId}`);
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    }
  };

  const fetchScans = async () => {
    try {
      const response = await apiRequest("GET", `/api/item-scans/${bookingId}`);
      if (response.ok) {
        const scanData = await response.json();
        setScans(scanData);
        if (scanData.length > 0) {
          setCurrentScan(scanData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch scans:', error);
      toast({
        title: "Error",
        description: "Failed to load 360° scans",
        variant: "destructive"
      });
    }
  };

  const nextImage = () => {
    if (currentScan && currentImageIndex < currentScan.scanImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const reportDamage = async (reporterType: 'owner' | 'renter') => {
    if (!damageDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the damage before submitting the report.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/damage-reports", {
        bookingId,
        reporterType,
        description: damageDescription,
        images: []
      });

      if (!response.ok) {
        throw new Error('Failed to submit damage report');
      }

      // Send email notification
      await apiRequest("POST", "/api/send-damage-report-email", {
        bookingId,
        reporterType,
        description: damageDescription
      });

      toast({
        title: "Report Submitted",
        description: "Damage report has been sent to Lendibl. We'll investigate and contact you soon.",
      });

      setShowDamageReport(false);
      setDamageDescription("");
      onClose();
    } catch (error) {
      toast({
        title: "Submit Failed",
        description: "Unable to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmGoodCondition = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/confirm-good-condition", {
        bookingId
      });

      if (!response.ok) {
        throw new Error('Failed to confirm condition');
      }

      toast({
        title: "Condition Confirmed",
        description: "Item condition confirmed as good. Rental completed successfully.",
      });

      setShowGoodReport(false);
      onClose();
    } catch (error) {
      toast({
        title: "Confirmation Failed",
        description: "Unable to confirm condition. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const preScan = scans.find(scan => scan.scanType === 'pre_rental');
  const postScan = scans.find(scan => scan.scanType === 'post_rental');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Item 360° Documentation</span>
          </DialogTitle>
          <DialogDescription>
            Review the pre-rental and post-rental condition of the item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Selection */}
          {scans.length > 0 && (
            <div className="flex space-x-2">
              {preScan && (
                <Button
                  onClick={() => {
                    setCurrentScan(preScan);
                    setCurrentImageIndex(0);
                  }}
                  variant={currentScan?.scanType === 'pre_rental' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Pre-Rental Scan
                  <Badge variant="secondary" className="ml-2">
                    {preScan.scanImages.length} images
                  </Badge>
                </Button>
              )}
              {postScan && (
                <Button
                  onClick={() => {
                    setCurrentScan(postScan);
                    setCurrentImageIndex(0);
                  }}
                  variant={currentScan?.scanType === 'post_rental' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Post-Rental Scan
                  <Badge variant="secondary" className="ml-2">
                    {postScan.scanImages.length} images
                  </Badge>
                </Button>
              )}
            </div>
          )}

          {/* Current Scan Display */}
          {currentScan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>
                      {currentScan.scanType === 'pre_rental' ? 'Pre-Rental' : 'Post-Rental'} Documentation
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{currentScan.user.firstName} {currentScan.user.lastName}</span>
                    <span>•</span>
                    <span>{new Date(currentScan.createdAt!).toLocaleDateString()}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Image Viewer */}
                <div className="relative mb-4">
                  <img
                    src={currentScan.scanImages[currentImageIndex]}
                    alt={`360° view ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  
                  {/* Navigation */}
                  {currentScan.scanImages.length > 1 && (
                    <>
                      <Button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        variant="outline"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={nextImage}
                        disabled={currentImageIndex === currentScan.scanImages.length - 1}
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {currentScan.scanImages.length} • {currentImageIndex * 45}°
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-8 gap-2">
                  {currentScan.scanImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded border-2 overflow-hidden ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center">
                        {index * 45}°
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Camera className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="font-semibold">No 360° Scans Available</h3>
                    <p className="text-sm text-gray-600">
                      Scans will appear here once they are completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {preScan && postScan && booking?.status === 'completed' && (
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowGoodReport(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Rental Looks Good
              </Button>
              <Button
                onClick={() => setShowDamageReport(true)}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Rental is Damaged. Report to Lendibl
              </Button>
            </div>
          )}

          {/* Renter Report Button */}
          {booking && booking.status === 'completed' && (
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowDamageReport(true)}
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Owner Gave Damaged Rental. Report to Lendibl
              </Button>
            </div>
          )}
        </div>

        {/* Damage Report Modal */}
        <Dialog open={showDamageReport} onOpenChange={setShowDamageReport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Report Damage to Lendibl</span>
              </DialogTitle>
              <DialogDescription>
                Describe the damage or issue with the rental item. This will be sent to Lendibl for investigation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe the damage, missing parts, or issues with the rental item..."
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                rows={4}
              />
              <div className="flex space-x-3">
                <Button
                  onClick={() => reportDamage('owner')}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Report Damage'}
                </Button>
                <Button
                  onClick={() => setShowDamageReport(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Good Condition Confirmation Modal */}
        <Dialog open={showGoodReport} onOpenChange={setShowGoodReport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Confirm Good Condition</span>
              </DialogTitle>
              <DialogDescription>
                Confirm that the rental item was returned in good condition with no damage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                By confirming, you're stating that the item was returned in the same condition as documented 
                in the pre-rental scan with no damage or missing parts.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={confirmGoodCondition}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Confirming...' : 'Confirm Good Condition'}
                </Button>
                <Button
                  onClick={() => setShowGoodReport(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}