import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Smartphone, Upload, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AR360ScannerProps {
  bookingId: number;
  scanType: 'pre_rental' | 'post_rental';
  onComplete: (scanImages: string[]) => void;
  onCancel: () => void;
}

export function AR360Scanner({ bookingId, scanType, onComplete, onCancel }: AR360ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const requiredImages = 8; // 8 images for 360 scan (every 45 degrees)

  useEffect(() => {
    if (!isMobile) {
      setShowMobilePrompt(true);
    }
  }, [isMobile]);

  const startCamera = async () => {
    setCameraLoading(true);
    setIsScanning(true); // Show video container immediately
    
    try {
      // Check if browser supports camera
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Get camera stream with back camera preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' } // Request back camera
        }
      });
      
      // Wait for video element to be ready
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element not ready");
      }
      
      // Set up video element
      const video = videoRef.current;
      video.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to load and start playing
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Camera timeout"));
        }, 5000);
        
        video.onloadeddata = () => {
          clearTimeout(timeout);
          video.play()
            .then(resolve)
            .catch(reject);
        };
        
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Video error"));
        };
      });
      
      setCameraLoading(false);
      
    } catch (error) {
      setCameraLoading(false);
      setIsScanning(false);
      
      // Stop any streams that might have been created
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to access camera. Try manual upload instead.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImages(prev => [...prev, imageDataUrl]);
    setCurrentAngle(prev => prev + 45);

    if (capturedImages.length + 1 >= requiredImages) {
      stopCamera();
    }
  };

  const retakeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    setCurrentAngle(prev => prev - 45);
    if (!isScanning) {
      startCamera();
    }
  };

  const handleFileUpload = (files: File[]) => {
    const promises = files.slice(0, requiredImages - capturedImages.length).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(dataUrls => {
      setCapturedImages(prev => [...prev, ...dataUrls]);
      toast({
        title: "Images Uploaded",
        description: `Added ${dataUrls.length} images to your 360° scan.`
      });
    });
  };


  const uploadScan = async () => {
    if (capturedImages.length < requiredImages) {
      toast({
        title: "Incomplete Scan",
        description: `Please capture all ${requiredImages} images for a complete 360° scan.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // If bookingId is 0 or falsy, we're in listing mode - skip API save
      if (bookingId && bookingId > 0) {
        const response = await apiRequest("POST", "/api/item-scans", {
          bookingId,
          scanType,
          scanImages: capturedImages
        });

        if (!response.ok) {
          throw new Error('Failed to save scan');
        }
      }

      toast({
        title: "360° Scan Complete",
        description: "Item condition has been documented successfully.",
      });

      onComplete(capturedImages);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Unable to save scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateMobileLink = () => {
    const currentUrl = window.location.href;
    const mobileUrl = `${currentUrl}?mobile=true&booking=${bookingId}&scan=${scanType}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(mobileUrl);
    toast({
      title: "Link Copied",
      description: "Mobile scanning link copied to clipboard. Send it to your phone.",
    });
  };

  if (showMobilePrompt && !isMobile) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Mobile Device Recommended</span>
            </DialogTitle>
            <DialogDescription>
              For the best 360° scanning experience, we recommend using a mobile device with a camera.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={generateMobileLink} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Continue on Mobile Device
            </Button>
            <Button onClick={() => setShowMobilePrompt(false)} variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Use Computer Camera Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>360° Item Documentation</span>
            <Badge variant={scanType === 'pre_rental' ? 'default' : 'secondary'}>
              {scanType === 'pre_rental' ? 'Pre-Rental' : 'Post-Rental'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Document the item's condition with a complete 360° scan. Capture {requiredImages} images by rotating around the item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(capturedImages.length / requiredImages) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {capturedImages.length}/{requiredImages}
            </span>
          </div>

          {/* Camera Feed */}
          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="w-full rounded-lg min-h-[300px] bg-gray-900"
                style={{ objectFit: 'cover' }}
              />
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg z-10">
                  <div className="text-center text-white">
                    <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Connecting to camera...</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-white border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold bg-black bg-opacity-50 px-2 py-1 rounded">
                    {currentAngle}°
                  </span>
                </div>
              </div>
              <Button
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                size="lg"
                disabled={cameraLoading}
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture ({capturedImages.length + 1}/{requiredImages})
              </Button>
            </div>
          )}

          {/* Start Camera */}
          {!isScanning && capturedImages.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Camera className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="font-semibold">Ready to Start 360° Scan</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Position the item in good lighting and start capturing
                    </p>
                    {!window.isSecureContext && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Camera requires HTTPS for security. Use manual upload if camera doesn't work.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={startCamera} size="lg" disabled={cameraLoading}>
                      <Camera className="h-4 w-4 mr-2" />
                      {cameraLoading ? "Starting Camera..." : "Start Camera"}
                    </Button>
                    <Button onClick={() => {
                      // For now, show a simple file input
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          handleFileUpload(Array.from(files));
                        }
                      };
                      input.click();
                    }} variant="outline" size="lg">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Captured Images Grid */}
          {capturedImages.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Captured Images</h4>
              <div className="grid grid-cols-4 gap-2">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Scan ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      onClick={() => retakeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </Button>
                    <span className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
                      {index * 45}°
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {capturedImages.length >= requiredImages ? (
              <Button onClick={uploadScan} disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete 360° Scan
                  </>
                )}
              </Button>
            ) : (
              <>
                {isScanning && (
                  <Button onClick={captureImage} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Image
                  </Button>
                )}
                {!isScanning && capturedImages.length > 0 && (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Continue Scanning
                  </Button>
                )}
              </>
            )}
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}