import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, RotateCcw, Check, X, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Capture360Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (images: string[]) => void;
  title: string;
  description: string;
}

export function Capture360({ isOpen, onClose, onComplete, title, description }: Capture360Props) {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const angleNames = ["Front", "Front-Right", "Right", "Back-Right", "Back", "Back-Left", "Left", "Front-Left"];

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please ensure camera permissions are granted.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const newImages = [...capturedImages, imageData];
    setCapturedImages(newImages);

    if (currentAngle < angles.length - 1) {
      setCurrentAngle(currentAngle + 1);
    } else {
      // All angles captured
      setIsCapturing(false);
      stopCamera();
      onComplete(newImages);
    }
  }, [capturedImages, currentAngle, angles.length, stopCamera, onComplete]);

  const startCapture = async () => {
    setCapturedImages([]);
    setCurrentAngle(0);
    setIsCapturing(true);
    await startCamera();
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setCurrentAngle(0);
    setIsCapturing(false);
    stopCamera();
  };

  const handleClose = () => {
    resetCapture();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isCapturing && capturedImages.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>360° Item Documentation</CardTitle>
                <CardDescription>
                  Take 8 photos around your item to create complete documentation. 
                  This helps protect both owner and renter by documenting the item's condition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {angleNames.map((name, index) => (
                    <div key={index} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-xs text-gray-500">{angles[index]}°</div>
                    </div>
                  ))}
                </div>
                <Button onClick={startCapture} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start 360° Capture
                </Button>
              </CardContent>
            </Card>
          )}

          {isCapturing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {currentAngle + 1} of {angles.length}: {angleNames[currentAngle]}
                </Badge>
                <Button variant="outline" onClick={resetCapture}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Angle indicator overlay */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                  Position item at {angleNames[currentAngle]} angle
                </div>
                
                {/* Capture button overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={captureImage}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentAngle) / angles.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {capturedImages.length > 0 && !isCapturing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>360° Capture Complete</span>
                </CardTitle>
                <CardDescription>
                  All {capturedImages.length} angles captured successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {capturedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${angleNames[index]} view`}
                        className="w-full h-24 object-cover rounded border-2 border-green-200"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                        {angleNames[index]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={resetCapture} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Photos
                  </Button>
                  <Button 
                    onClick={() => onComplete(capturedImages)} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Save Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}