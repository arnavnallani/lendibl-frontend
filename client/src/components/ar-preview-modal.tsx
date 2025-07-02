import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, X, Camera } from "lucide-react";

interface ARPreviewModalProps {
  onClose: () => void;
  capturedImages: string[];
}

export default function ARPreviewModal({ onClose, capturedImages }: ARPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera for better AR experience
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
        setStreamError(null);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStreamError('Unable to access camera. Please allow camera permissions.');
      setIsStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 text-white">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Eye className="h-6 w-6" />
            AR Preview - Your Scan Results
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {streamError ? (
          <div className="flex items-center justify-center h-full bg-gray-900 text-white text-center p-8">
            <div className="space-y-4">
              <Camera className="h-16 w-16 mx-auto text-gray-400" />
              <p className="text-lg">{streamError}</p>
              <Button 
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* AR Overlays */}
            {isStreamActive && (
              <>
                {/* Scanning frame - shows completed scan area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-green-400 border-dashed rounded-lg flex items-center justify-center animate-pulse">
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <span className="text-green-300 font-semibold text-lg">
                        ✓ Scan Complete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="absolute top-20 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center space-x-3 text-white">
                      <div className="flex-1 bg-white/20 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: "100%" }}
                        />
                      </div>
                      <span className="text-sm font-medium">8/8 Photos ✓</span>
                    </div>
                  </div>
                </div>

                {/* Captured images preview */}
                <div className="absolute top-20 right-4 space-y-2 max-h-96 overflow-y-auto">
                  {capturedImages.slice(0, 8).map((image, index) => (
                    <div 
                      key={index} 
                      className="w-16 h-12 bg-black/50 backdrop-blur-sm rounded border-2 border-green-400 overflow-hidden"
                    >
                      <img 
                        src={image} 
                        alt={`Scan ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-green-300 text-xs font-bold bg-black/50 rounded px-1">
                          ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Angle indicators around the scanning frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-80 h-80">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
                      const radian = (angle * Math.PI) / 180;
                      const x = Math.cos(radian) * 140;
                      const y = Math.sin(radian) * 140;
                      
                      return (
                        <div
                          key={angle}
                          className="absolute w-8 h-8 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-green-300"
                          style={{
                            left: `calc(50% + ${x}px - 16px)`,
                            top: `calc(50% + ${y}px - 16px)`,
                          }}
                        >
                          ✓
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AR Instructions overlay */}
                <div className="absolute bottom-20 left-4 right-4">
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white text-center">
                    <h4 className="font-semibold mb-2">360° Documentation Complete</h4>
                    <p className="text-sm text-gray-300">
                      This is how your item was scanned and documented. All 8 angles captured successfully for comprehensive protection.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            <Eye className="h-5 w-5 mr-2" />
            Close AR Preview
          </Button>
        </div>
      </div>
    </div>
  );
}