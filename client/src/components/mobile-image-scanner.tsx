import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
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
    console.log('📱 Starting camera...');
    try {
      if (stream) {
        console.log('🔄 Stopping existing stream');
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };

      console.log('📞 Requesting camera with constraints:', constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream received');
      setStream(newStream);

      if (videoRef.current) {
        console.log('🎬 Setting video source and playing');
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      } else {
        console.log('❌ Video ref not available');
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

  const enhanceImage = (canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Enhance image quality for product photography
    const contrastFactor = 1.1;
    const brightnessFactor = 5;
    const saturationFactor = 1.15;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply contrast and brightness
      r = Math.min(255, Math.max(0, (r - 128) * contrastFactor + 128 + brightnessFactor));
      g = Math.min(255, Math.max(0, (g - 128) * contrastFactor + 128 + brightnessFactor));
      b = Math.min(255, Math.max(0, (b - 128) * contrastFactor + 128 + brightnessFactor));

      // Apply saturation enhancement
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.min(255, Math.max(0, gray + saturationFactor * (r - gray)));
      g = Math.min(255, Math.max(0, gray + saturationFactor * (g - gray)));
      b = Math.min(255, Math.max(0, gray + saturationFactor * (b - gray)));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const captureImage = async () => {
    console.log('🎯 Capture button clicked!');
    console.log('Video ref:', videoRef.current);
    console.log('Canvas ref:', canvasRef.current);
    console.log('Captured images count:', capturedImages.length, 'Max:', maxImages);
    
    if (!videoRef.current || !canvasRef.current || capturedImages.length >= maxImages) {
      console.log('❌ Early return - missing refs or max images reached');
      return;
    }

    setIsCapturing(true);
    console.log('📸 Starting capture process...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.log('❌ No canvas context');
        return;
      }

      // Set canvas size to video dimensions
      console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('🖼️ Drew image to canvas');

      // Enhance the captured image
      const enhancedImage = enhanceImage(canvas);
      console.log('✨ Enhanced image:', enhancedImage.substring(0, 50) + '...');
      
      setCapturedImages(prev => {
        const newImages = [...prev, enhancedImage];
        console.log('📊 Updated captured images count:', newImages.length);
        return newImages;
      });
      
      toast({
        title: "Image Captured",
        description: `Captured ${capturedImages.length + 1} of ${maxImages} images`,
      });

      console.log('✅ Capture completed successfully');

    } catch (error) {
      console.error('❌ Error capturing image:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🔄 Setting isCapturing to false');
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

  const handleTapToFocus = async (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!stream) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;

    setFocusPoint({ x, y });

    // Clear focus point after animation
    setTimeout(() => setFocusPoint(null), 1000);

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ 
            focusMode: 'continuous',
            pointsOfInterest: [{ x: x / 100, y: y / 100 }]
          } as any]
        });
      }
    } catch (error) {
      console.log('Manual focus not supported on this device');
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col touch-manipulation">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white relative z-10">
        <button 
          onClick={(e) => {
            console.log('❌ CLOSE BUTTON CLICKED!', e);
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onTouchStart={(e) => {
            console.log('👆 TOUCH START on close button');
            e.stopPropagation();
          }}
          className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium select-none">
          Photo Capture ({capturedImages.length}/{maxImages})
        </span>
        <button 
          onClick={toggleFlash}
          className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white border-none cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Flashlight className={`h-5 w-5 ${flashEnabled ? 'text-yellow-400' : ''}`} />
        </button>
      </div>

      {/* Camera View */}
      <div 
        className="flex-1 relative overflow-hidden select-none touch-manipulation" 
        onTouchStart={handleTapToFocus}
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover select-none"
          playsInline
          muted
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        />
        
        {/* Focus Point Indicator */}
        {focusPoint && (
          <div 
            className="absolute w-16 h-16 border-2 border-yellow-400 rounded-full animate-ping pointer-events-none"
            style={{
              left: `${focusPoint.x}%`,
              top: `${focusPoint.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
        
        {/* Photo Guidance Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            {/* Center circle guide for focus */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-2 border-white/50 rounded-full"></div>
            </div>
            
            {/* Rule of thirds grid */}
            <div className="absolute inset-0">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20"></div>
                ))}
              </div>
            </div>
            
            {/* Center guidance text */}
            <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center">
              <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                <p className="text-sm">Position your item in good lighting</p>
                <p className="text-xs text-gray-300">Tap to focus • Hold steady when capturing</p>
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
      <div className="bg-black p-6 relative z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Retake Button */}
          <button
            onClick={retake}
            disabled={capturedImages.length === 0}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 rounded-lg cursor-pointer touch-manipulation flex items-center"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Retake
          </button>

          {/* Capture Button */}
          <button
            onClick={(e) => {
              console.log('🔥 CAPTURE BUTTON CLICKED!', e);
              e.preventDefault();
              e.stopPropagation();
              captureImage();
            }}
            onTouchStart={(e) => {
              console.log('👆 TOUCH START on capture button');
              e.stopPropagation();
            }}
            disabled={isCapturing || capturedImages.length >= maxImages}
            className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 cursor-pointer touch-manipulation flex items-center justify-center border-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Camera className="h-6 w-6 text-black" />
          </button>

          {/* Done Button */}
          <button
            onClick={finishScanning}
            disabled={capturedImages.length === 0}
            className="px-4 py-2 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer touch-manipulation flex items-center"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Check className="h-5 w-5 mr-2" />
            Done
          </button>
        </div>

        {/* Camera Toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={toggleCamera}
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg cursor-pointer touch-manipulation flex items-center"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Switch Camera
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}