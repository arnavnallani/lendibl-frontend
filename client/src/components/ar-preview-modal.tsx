import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface ARPreviewModalProps {
  onClose: () => void;
  capturedImages: string[];
}

export default function ARPreviewModal({ onClose, capturedImages }: ARPreviewModalProps) {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setCurrentAngle(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate]);

  // Get the image for current angle (8 images = 45° each)
  const getCurrentImage = () => {
    if (capturedImages.length === 0) return null;
    const imageIndex = Math.floor(currentAngle / 45) % capturedImages.length;
    return capturedImages[imageIndex] || capturedImages[0];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const sensitivity = 0.5;
    const newAngle = (currentAngle + deltaX * sensitivity) % 360;
    setCurrentAngle(newAngle < 0 ? newAngle + 360 : newAngle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const toggleAutoRotate = () => setAutoRotate(prev => !prev);

  const currentImage = getCurrentImage();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Eye className="h-6 w-6" />
          360° Item Viewer
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-600 hover:bg-gray-200"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* 3D Model Viewer */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {currentImage ? (
            <div className="relative">
              {/* Main 3D Object */}
              <div 
                className="transition-transform duration-100 ease-out"
                style={{
                  transform: `scale(${zoom}) perspective(1000px) rotateY(${currentAngle}deg)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <img
                  src={currentImage}
                  alt="360° Item View"
                  className="max-w-none max-h-none w-auto h-auto max-w-[80vh] max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  draggable={false}
                />
              </div>

              {/* Floating angle indicator */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                <div className="text-sm font-medium">
                  {Math.round(currentAngle)}°
                </div>
              </div>

              {/* 360° rotation guide */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                  Drag to rotate • Scroll to zoom
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
                <Eye className="h-16 w-16 text-gray-400" />
              </div>
              <p>No scan images available</p>
            </div>
          )}
        </div>

        {/* Image thumbnails strip */}
        {capturedImages.length > 0 && (
          <div className="absolute bottom-4 right-4 space-y-1">
            {capturedImages.map((image, index) => {
              const angle = index * 45;
              const isActive = Math.abs(currentAngle - angle) < 22.5 || 
                             Math.abs(currentAngle - angle - 360) < 22.5 ||
                             Math.abs(currentAngle - angle + 360) < 22.5;
              
              return (
                <div
                  key={index}
                  className={`w-12 h-8 rounded border-2 overflow-hidden cursor-pointer transition-all ${
                    isActive ? 'border-blue-400 scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    setCurrentAngle(angle);
                    setAutoRotate(false);
                  }}
                >
                  <img 
                    src={image} 
                    alt={`Angle ${angle}°`}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white/80 backdrop-blur-sm border-t p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRotate}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${autoRotate ? 'animate-spin' : ''}`} />
            Auto Rotate
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Eye className="h-4 w-4 mr-2" />
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}