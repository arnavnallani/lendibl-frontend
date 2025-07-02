import { useState, useRef, useEffect } from "react";
import { Camera, X, Check, RotateCcw, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MobileImageScannerProps {
  onCapture: (images: string[]) => void;
  onClose: () => void;
  maxImages?: number;
}

export default function MobileImageScanner({ onCapture, onClose, maxImages = 8 }: MobileImageScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const detectDocumentEdges = (imageData: ImageData): [number, number][] => {
    const { data, width, height } = imageData;
    const edges: [number, number][] = [];
    
    // Simple edge detection - find corners of rectangular objects
    const threshold = 100;
    const corners: [number, number][] = [
      [width * 0.1, height * 0.1], // Top-left
      [width * 0.9, height * 0.1], // Top-right
      [width * 0.9, height * 0.9], // Bottom-right
      [width * 0.1, height * 0.9], // Bottom-left
    ];
    
    // For now, return default corners - can be enhanced with computer vision
    return corners;
  };

  const perspectiveCorrection = (canvas: HTMLCanvasElement, corners: [number, number][]): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL();

    // Create a new canvas for the corrected image
    const correctedCanvas = document.createElement('canvas');
    const correctedCtx = correctedCanvas.getContext('2d');
    if (!correctedCtx) return canvas.toDataURL();

    // Set standard document size
    correctedCanvas.width = 595; // A4 width at 72 DPI
    correctedCanvas.height = 842; // A4 height at 72 DPI

    // Draw white background
    correctedCtx.fillStyle = 'white';
    correctedCtx.fillRect(0, 0, correctedCanvas.width, correctedCanvas.height);

    // Simple perspective correction - map corners to rectangle
    const srcCorners = corners;
    const dstCorners: [number, number][] = [
      [50, 50],
      [correctedCanvas.width - 50, 50],
      [correctedCanvas.width - 50, correctedCanvas.height - 50],
      [50, correctedCanvas.height - 50]
    ];

    // For a complete perspective correction, we'd use matrix transformations
    // For now, we'll just crop and scale the center area
    const sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Calculate crop area from corners
    const minX = Math.min(...srcCorners.map(c => c[0]));
    const maxX = Math.max(...srcCorners.map(c => c[0]));
    const minY = Math.min(...srcCorners.map(c => c[1]));
    const maxY = Math.max(...srcCorners.map(c => c[1]));
    
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    // Draw the cropped area scaled to fit the corrected canvas
    correctedCtx.drawImage(
      canvas,
      minX, minY, cropWidth, cropHeight,
      50, 50, correctedCanvas.width - 100, correctedCanvas.height - 100
    );

    return correctedCanvas.toDataURL('image/jpeg', 0.9);
  };

  const enhanceImage = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Enhance contrast and brightness for document scanning
    const contrastFactor = 1.2;
    const brightnessFactor = 10;

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast and brightness
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128 + brightnessFactor));     // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128 + brightnessFactor)); // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128 + brightnessFactor)); // B
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || capturedImages.length >= maxImages) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect document edges
      const corners = detectDocumentEdges(imageData);
      
      // Apply perspective correction
      const correctedImage = perspectiveCorrection(canvas, corners);
      
      // Create a new canvas for enhancement
      const enhanceCanvas = document.createElement('canvas');
      const enhanceCtx = enhanceCanvas.getContext('2d');
      if (!enhanceCtx) return;

      const img = new Image();
      img.onload = () => {
        enhanceCanvas.width = img.width;
        enhanceCanvas.height = img.height;
        enhanceCtx.drawImage(img, 0, 0);
        
        // Enhance the image
        const enhancedImage = enhanceImage(enhanceCanvas);
        
        setCapturedImages(prev => [...prev, enhancedImage]);
        
        toast({
          title: "Image Captured",
          description: `Captured ${capturedImages.length + 1} of ${maxImages} images`,
        });
      };
      img.src = correctedImage;

    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleFlash = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } else {
        toast({
          title: "Flash Not Available",
          description: "Flash is not supported on this device",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Flash not supported:', error);
      toast({
        title: "Flash Error",
        description: "Unable to control flash on this device",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const finishScanning = () => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
    }
    onClose();
  };

  const retake = () => {
    setCapturedImages([]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">
          Scan Documents ({capturedImages.length}/{maxImages})
        </span>
        <Button variant="ghost" size="sm" onClick={toggleFlash}>
          <Flashlight className={`h-5 w-5 ${flashEnabled ? 'text-yellow-400' : ''}`} />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Document Detection Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-white/30 relative">
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white"></div>
            
            {/* Center guidance text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
                <p className="text-sm">Position document within frame</p>
                <p className="text-xs text-gray-300">Ensure good lighting and steady hands</p>
              </div>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Captured Images Preview */}
      {capturedImages.length > 0 && (
        <div className="bg-black/80 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {capturedImages.map((image, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={image}
                  alt={`Captured ${index + 1}`}
                  className="w-16 h-20 object-cover rounded border-2 border-white"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black p-6">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Retake Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={retake}
            disabled={capturedImages.length === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Retake
          </Button>

          {/* Capture Button */}
          <Button
            size="lg"
            onClick={captureImage}
            disabled={isCapturing || capturedImages.length >= maxImages}
            className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            <Camera className="h-6 w-6 text-black" />
          </Button>

          {/* Done Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={finishScanning}
            disabled={capturedImages.length === 0}
            className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Done
          </Button>
        </div>

        {/* Camera Toggle */}
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCamera}
            className="text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Switch Camera
          </Button>
        </div>
      </div>
    </div>
  );
}