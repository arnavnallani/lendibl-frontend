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
  const [velocity, setVelocity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef({ x: 0, y: 0, time: 0 });

  // Enhanced auto-rotate with momentum
  useEffect(() => {
    if (!autoRotate && Math.abs(velocity) < 0.1) return;
    
    const interval = setInterval(() => {
      if (autoRotate) {
        setCurrentAngle(prev => (prev + 0.8) % 360);
      } else if (Math.abs(velocity) > 0.1) {
        setCurrentAngle(prev => {
          const newAngle = (prev + velocity) % 360;
          return newAngle < 0 ? newAngle + 360 : newAngle;
        });
        setVelocity(prev => prev * 0.95); // Friction
      }
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [autoRotate, velocity]);

  // Smooth image interpolation for better 360° effect
  const getCurrentImage = () => {
    if (capturedImages.length === 0) return null;
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const imageIndex = Math.floor(normalizedAngle / 45) % capturedImages.length;
    return capturedImages[imageIndex] || capturedImages[0];
  };

  // Enhanced mouse/touch handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsDraggingPosition(e.shiftKey || e.ctrlKey);
    setAutoRotate(false);
    setVelocity(0);
    setDragStart({ x: e.clientX, y: e.clientY });
    lastTouchRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchRef.current.time;
    
    if (isDraggingPosition) {
      // Move item position
      setPosition(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
    } else {
      // Rotate item with enhanced sensitivity
      const sensitivity = 0.8;
      const newAngle = (currentAngle + deltaX * sensitivity) % 360;
      setCurrentAngle(newAngle < 0 ? newAngle + 360 : newAngle);
      
      // Calculate velocity for momentum
      if (timeDelta > 0) {
        setVelocity(deltaX * sensitivity / timeDelta * 16);
      }
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    lastTouchRef.current = { x: e.clientX, y: e.clientY, time: currentTime };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsDraggingPosition(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom(prev => Math.max(0.3, Math.min(5, prev + delta)));
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setCurrentAngle(0);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.3));
  const toggleAutoRotate = () => {
    setAutoRotate(prev => !prev);
    setVelocity(0);
  };

  const currentImage = getCurrentImage();

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Eye className="h-6 w-6" />
          360° Item Viewer
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-600 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* 3D Model Viewer */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center select-none touch-none"
          style={{
            cursor: isDragging ? (isDraggingPosition ? 'grabbing' : 'grabbing') : 'grab'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {currentImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Enhanced 3D Object with smooth transitions */}
              <div 
                className="relative transition-all duration-75 ease-out will-change-transform"
                style={{
                  transform: `
                    translate(${position.x}px, ${position.y}px) 
                    scale(${zoom}) 
                    perspective(1200px) 
                    rotateY(${currentAngle}deg)
                  `,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Clean white showcase container */}
                <div 
                  className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                  style={{
                    padding: '60px',
                    filter: 'drop-shadow(0 25px 80px rgba(0,0,0,0.12))'
                  }}
                >
                  {/* Multi-layer background removal system */}
                  <div className="relative">
                    {/* Base white background layer */}
                    <div 
                      className="absolute inset-0 bg-white rounded-2xl"
                      style={{ zIndex: 1 }}
                    />
                    
                    {/* Layer 1: Duplicate image for background removal base */}
                    <img
                      src={currentImage}
                      alt=""
                      className="absolute max-w-[55vh] max-h-[55vh] w-auto h-auto object-contain mx-auto inset-0"
                      style={{
                        filter: 'contrast(2) brightness(2) saturate(0) blur(1px)',
                        mixBlendMode: 'hard-light',
                        opacity: 0.8,
                        zIndex: 2
                      }}
                    />
                    
                    {/* Layer 2: Main item image with strong enhancement */}
                    <img
                      src={currentImage}
                      alt="360° Item View"
                      className="relative max-w-[55vh] max-h-[55vh] w-auto h-auto object-contain mx-auto block"
                      draggable={false}
                      style={{
                        backfaceVisibility: 'hidden',
                        filter: 'contrast(1.6) saturate(1.4) brightness(1.2) drop-shadow(0 0 30px white)',
                        mixBlendMode: 'multiply',
                        zIndex: 5
                      }}
                    />
                    
                    {/* Layer 3: Aggressive edge masking */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `
                          radial-gradient(ellipse 35% 35% at center, transparent 0%, rgba(255,255,255,0.7) 50%, white 85%),
                          radial-gradient(ellipse 50% 50% at center, transparent 0%, rgba(255,255,255,0.5) 60%, white 90%),
                          linear-gradient(0deg, white 0%, transparent 20%, transparent 80%, white 100%),
                          linear-gradient(90deg, white 0%, transparent 20%, transparent 80%, white 100%),
                          linear-gradient(45deg, white 0%, transparent 30%, transparent 70%, white 100%),
                          linear-gradient(-45deg, white 0%, transparent 30%, transparent 70%, white 100%)
                        `,
                        mixBlendMode: 'lighten',
                        zIndex: 3
                      }}
                    />
                    
                    {/* Layer 4: Final white overlay for complete background removal */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(ellipse 70% 70% at center, transparent 30%, white 80%)',
                        mixBlendMode: 'screen',
                        opacity: 0.9,
                        zIndex: 4
                      }}
                    />
                  </div>
                  
                  {/* Subtle grid pattern for professional look */}
                  <div 
                    className="absolute inset-0 rounded-3xl pointer-events-none opacity-30"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />
                  
                  {/* Professional lighting effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%, rgba(240,240,240,0.3) 100%)'
                    }}
                  />
                </div>
              </div>

              {/* Enhanced floating controls */}
              <div className="absolute top-6 left-6">
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl px-4 py-3 text-white shadow-xl">
                  <div className="text-sm font-semibold">
                    {Math.round(currentAngle)}°
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    {Math.round(zoom * 100)}% zoom
                  </div>
                </div>
              </div>

              {/* Interactive instructions */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl px-6 py-3 text-white text-sm shadow-xl">
                  <div className="flex items-center space-x-4">
                    <span>👆 Drag to rotate</span>
                    <span>•</span>
                    <span>🔍 Scroll to zoom</span>
                    <span>•</span>
                    <span>✋ Hold Shift to move</span>
                  </div>
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

        {/* Enhanced thumbnail strip */}
        {capturedImages.length > 0 && (
          <div className="absolute bottom-6 right-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border border-gray-200">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600 text-center mb-3">
                  360° Views
                </div>
                {capturedImages.map((image, index) => {
                  const angle = index * 45;
                  const angleDiff = Math.min(
                    Math.abs(currentAngle - angle),
                    Math.abs(currentAngle - angle - 360),
                    Math.abs(currentAngle - angle + 360)
                  );
                  const isActive = angleDiff < 22.5;
                  
                  return (
                    <div
                      key={index}
                      className={`relative w-14 h-10 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white scale-110 shadow-lg' 
                          : 'hover:scale-105 shadow-md hover:shadow-lg border border-gray-200'
                      }`}
                      onClick={() => {
                        setCurrentAngle(angle);
                        setAutoRotate(false);
                        setVelocity(0);
                      }}
                    >
                      <img 
                        src={image} 
                        alt={`${angle}°`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="text-[10px] text-white font-medium text-center p-1">
                          {angle}°
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Controls */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-6">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.3}
              className="h-10 w-10 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="text-sm text-gray-700 font-medium min-w-[80px] text-center bg-gray-50 rounded-lg px-3 py-2">
              {Math.round(zoom * 100)}%
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="h-10 w-10 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-8 bg-gray-300" />
          
          {/* Auto-rotate Toggle */}
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRotate}
            className="h-10"
          >
            <RotateCw className={`h-4 w-4 mr-2 ${autoRotate ? 'animate-spin' : ''}`} />
            Auto Rotate
          </Button>
          
          {/* Reset Position */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetPosition}
            className="h-10"
          >
            Reset View
          </Button>
          
          <div className="w-px h-8 bg-gray-300" />
          
          {/* Close Button */}
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-8"
          >
            <Eye className="h-4 w-4 mr-2" />
            Close Viewer
          </Button>
        </div>
        
        {/* Performance indicator */}
        <div className="text-center mt-4 text-xs text-gray-500">
          High-performance 360° viewer • Touch and drag supported
        </div>
      </div>
    </div>
  );
}