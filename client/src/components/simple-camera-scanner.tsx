import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleCameraScannerProps {
  onCapture: (images: string[]) => void;
  onClose: () => void;
  maxImages?: number;
}

export default function SimpleCameraScanner({ onCapture, onClose, maxImages = 8 }: SimpleCameraScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Function to explicitly stop camera
  const stopCamera = () => {
    console.log('🛑 SimpleCameraScanner: Explicitly stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track stopped:', track.kind, track.readyState);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        console.log('🛑 SimpleCameraScanner: Stopping camera stream on cleanup');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, stream]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('🛑 SimpleCameraScanner: Final cleanup - stopping all camera tracks');
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🔇 Track stopped:', track.kind, track.readyState);
        });
        setStream(null);
      }
    };
  }, []);

  const startCamera = async () => {
    console.log('📱 Starting camera with mode:', facingMode);
    setCameraReady(false);
    
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

      console.log('📞 Requesting camera access...');
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera access granted');
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        
        // Wait for video to be ready
        const handleLoadedMetadata = () => {
          console.log('✅ Camera ready for capture');
          setCameraReady(true);
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        await videoRef.current.play();
        console.log('🎥 Video playing');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const captureImage = () => {
    console.log('🎯 Capture initiated');
    
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      console.log('❌ Camera not ready');
      toast({
        title: "Camera Not Ready",
        description: "Please wait for camera to initialize",
        variant: "destructive",
      });
      return;
    }

    if (capturedImages.length >= maxImages) {
      console.log('❌ Max images reached');
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.log('❌ No canvas context');
        return;
      }

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to image
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      
      setCapturedImages(prev => [...prev, imageData]);
      
      console.log('✅ Image captured successfully');
      toast({
        title: "Image Captured",
        description: `Captured ${capturedImages.length + 1} of ${maxImages} images`,
      });

    } catch (error) {
      console.error('❌ Capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture image",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCamera = () => {
    console.log('🔄 Switching camera');
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const finishScanning = () => {
    console.log('🎯 SimpleCameraScanner finishScanning called');
    if (capturedImages.length > 0) {
      console.log('📸 Captured images:', capturedImages.length);
      onCapture(capturedImages);
    }
    stopCamera();
    console.log('❌ Calling onClose to return to scan modal');
    onClose(); // This will close the camera and return to the scan modal
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black z-[10000] flex flex-col h-screen"
      style={{ 
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        height: '100dvh' // Use dynamic viewport height for mobile
      }}
      onClick={(e) => {
        // Prevent any clicks from bubbling up to parent modals
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/70 text-white flex-shrink-0">
        <button
          onClick={(e) => {
            console.log('❌ X button clicked');
            e.preventDefault();
            e.stopPropagation();
            stopCamera();
            onClose();
          }}
          className="p-3 cursor-pointer bg-white/10 rounded-lg active:bg-white/20"
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px'
          }}
        >
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium">
          Scan Item ({capturedImages.length}/{maxImages})
        </span>
        <div className="w-12"></div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative min-h-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ 
            WebkitUserSelect: 'none',
            userSelect: 'none',
            maxHeight: 'calc(100vh - 200px)'
          }}
        />
        
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Captured Images Preview */}
      {capturedImages.length > 0 && (
        <div className="bg-black/80 p-3 flex-shrink-0">
          <div className="flex space-x-2 overflow-x-auto">
            {capturedImages.map((image, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={image}
                  alt={`Captured ${index + 1}`}
                  className="w-12 h-16 object-cover rounded border border-white"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '20px',
                    minWidth: '20px'
                  }}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black p-6 flex-shrink-0">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Switch Camera */}
          <button
            onClick={toggleCamera}
            className="px-4 py-2 bg-white/20 text-white rounded-lg cursor-pointer flex items-center active:bg-white/30"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '80px'
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Switch
          </button>

          {/* Capture Button */}
          <button
            onClick={captureImage}
            disabled={!cameraReady || isCapturing || capturedImages.length >= maxImages}
            className={`h-16 w-16 rounded-full bg-white flex items-center justify-center cursor-pointer ${
              !cameraReady || isCapturing || capturedImages.length >= maxImages 
                ? 'opacity-50' 
                : 'active:bg-gray-200'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minHeight: '64px',
              minWidth: '64px'
            }}
          >
            <Camera className="h-6 w-6 text-black" />
          </button>

          {/* Done Button */}
          <button
            onClick={(e) => {
              console.log('✅ Done button clicked');
              e.preventDefault();
              e.stopPropagation();
              finishScanning();
            }}
            disabled={capturedImages.length === 0}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer flex items-center ${
              capturedImages.length === 0 ? 'opacity-50' : 'active:bg-blue-700'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '80px'
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}