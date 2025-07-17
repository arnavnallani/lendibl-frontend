import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Camera, Eye, Upload, X, CheckCircle, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BookingWithDetails } from "@shared/schema";
import SimpleCameraScanner from "@/components/simple-camera-scanner";

interface ItemScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental?: BookingWithDetails;
  mode: 'scan' | 'view';
}

export default function ItemScanModal({ 
  isOpen, 
  onClose, 
  rental,
  mode 
}: ItemScanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanImages, setScanImages] = useState<string[]>([]);
  const [scanNotes, setScanNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔄 ItemScanModal state changed - isOpen:', isOpen, 'showScanner:', showScanner);
  }, [isOpen, showScanner]);

  const saveScanMutation = useMutation({
    mutationFn: async (scanData: any) => {
      return api.saveItemScan(scanData);
    },
    onSuccess: () => {
      toast({
        title: "Item Scan Saved",
        description: "Pre-rental item documentation has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/action-dashboard'] });
      onClose();
      setScanImages([]);
      setScanNotes('');
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save item scan. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newImages: string[] = [];

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === files.length) {
            setScanImages(prev => [...prev, ...newImages].slice(0, 8)); // Max 8 images
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setScanImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveScan = () => {
    if (scanImages.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image of the item.",
        variant: "destructive",
      });
      return;
    }

    const scanData = {
      rentalId: rental?.id,
      images: scanImages,
      notes: scanNotes,
      scannedAt: new Date().toISOString()
    };

    saveScanMutation.mutate(scanData);
  };

  // Fetch actual scan data for both viewing and editing mode
  const { data: existingScan, isLoading: isLoadingScan } = useQuery({
    queryKey: ['/api/item-scans', rental?.id],
    enabled: !!rental?.id,
  }) as { data: { images: string[]; notes: string; scannedAt: string } | undefined; isLoading: boolean };

  // Pre-populate scan data when in scan mode and existing scan is loaded
  useEffect(() => {
    if (mode === 'scan' && existingScan && scanImages.length === 0) {
      setScanImages(existingScan.images || []);
      setScanNotes(existingScan.notes || '');
    }
  }, [mode, existingScan, scanImages.length]);

  if (mode === 'view') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="scan-view-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pre-Rental Item Scan
            </DialogTitle>
          </DialogHeader>
          <div id="scan-view-description" className="sr-only">
            View the pre-rental item scan documentation
          </div>

          {isLoadingScan ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !existingScan ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No scan data found for this rental.</p>
            </div>
          ) : (
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Item Documented</span>
              </div>
              <p className="text-blue-700 text-sm">
                Scanned on {new Date(existingScan.scannedAt).toLocaleDateString()} at {new Date(existingScan.scannedAt).toLocaleTimeString()}
              </p>
            </div>

            {existingScan.images.length > 0 && (
              <div>
                <Label>Item Photos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {existingScan.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Item scan ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingScan.notes && (
              <div>
                <Label>Scan Notes</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{existingScan.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={isOpen && !showScanner} onOpenChange={(open) => {
      console.log('🎯 ItemScanModal Dialog onOpenChange:', open, 'showScanner:', showScanner);
      if (!open && !showScanner) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="scan-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Item Before Rental
          </DialogTitle>
        </DialogHeader>
        <div id="scan-modal-description" className="sr-only">
          Upload photos and document the item condition before rental begins
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Document Item Condition</span>
            </div>
            <p className="text-blue-700 text-sm">
              Take photos of your item before giving it to the renter. This creates documentation of the item's condition for protection during the rental.
            </p>
          </div>

          <div>
            <Label>Upload Photos (Max 8)</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {scanImages.length < 8 && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-32 border-dashed border-2 border-gray-300 hover:border-gray-400"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {isUploading ? 'Uploading...' : 'Click to upload photos'}
                      </p>
                    </div>
                  </Button>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                      disabled={isUploading}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Scan Item
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {scanImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {scanImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Scan ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="scan-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="scan-notes"
              placeholder="Note any existing wear, damage, or special conditions..."
              value={scanNotes}
              onChange={(e) => setScanNotes(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveScan}
              disabled={saveScanMutation.isPending || scanImages.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {saveScanMutation.isPending ? 'Saving...' : 'Save Scan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Mobile Scanner Modal - Outside main dialog for proper z-index */}
    {showScanner && (
      <SimpleCameraScanner
        onClose={() => {
          console.log('🎯 ItemScanModal: SimpleCameraScanner onClose called');
          setShowScanner(false);
        }}
        onCapture={(capturedImages: string[]) => {
          console.log('📸 ItemScanModal: Images captured from camera:', capturedImages.length);
          setScanImages(prev => [...prev, ...capturedImages].slice(0, 8));
          setShowScanner(false);
        }}
      />
    )}
    </>
  );
}