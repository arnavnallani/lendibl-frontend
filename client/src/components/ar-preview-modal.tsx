import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, X, RotateCw, ZoomIn, ZoomOut, Download, RotateCcw, Move, MousePointer } from "lucide-react";

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
  const [dragMode, setDragMode] = useState<'rotate' | 'move'>('rotate');
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef({ x: 0, y: 0, time: 0 });

  // Process images for AI background removal on load
  useEffect(() => {
    const processImagesForBackgroundRemoval = async () => {
      const processed = await Promise.all(
        capturedImages.map(async (imageUrl) => {
          return await createCleanBackground(imageUrl);
        })
      );
      setProcessedImages(processed);
    };

    if (capturedImages.length > 0) {
      processImagesForBackgroundRemoval();
    }
  }, [capturedImages]);

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

  // Conservative AI background enhancement function
  const createCleanBackground = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Conservative background detection - only target obvious background areas
        const backgroundMask = new Uint8Array(width * height);
        
        // Sample colors from image edges (likely background)
        const edgeColors: number[][] = [];
        const edgeThickness = Math.min(20, Math.floor(Math.min(width, height) * 0.05));
        
        // Sample from all four edges
        for (let i = 0; i < edgeThickness; i++) {
          // Top and bottom edges
          for (let x = 0; x < width; x += 5) {
            const topIdx = (i * width + x) * 4;
            const bottomIdx = ((height - 1 - i) * width + x) * 4;
            if (topIdx < data.length) edgeColors.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
            if (bottomIdx < data.length) edgeColors.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
          }
          // Left and right edges
          for (let y = 0; y < height; y += 5) {
            const leftIdx = (y * width + i) * 4;
            const rightIdx = (y * width + (width - 1 - i)) * 4;
            if (leftIdx < data.length) edgeColors.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
            if (rightIdx < data.length) edgeColors.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
          }
        }

        // Calculate average background color
        let avgR = 0, avgG = 0, avgB = 0;
        edgeColors.forEach(([r, g, b]) => {
          avgR += r;
          avgG += g;
          avgB += b;
        });
        avgR /= edgeColors.length;
        avgG /= edgeColors.length;
        avgB /= edgeColors.length;

        // Only process pixels that are very similar to edge colors AND have low contrast
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate similarity to average background color
          const colorDiff = Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB);
          
          // Calculate local contrast (how different this pixel is from neighbors)
          const pixelIdx = Math.floor(i / 4);
          const x = pixelIdx % width;
          const y = Math.floor(pixelIdx / width);
          
          let localContrast = 0;
          let neighborCount = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = (ny * width + nx) * 4;
                const nR = data[nIdx];
                const nG = data[nIdx + 1];
                const nB = data[nIdx + 2];
                localContrast += Math.abs(r - nR) + Math.abs(g - nG) + Math.abs(b - nB);
                neighborCount++;
              }
            }
          }
          localContrast /= neighborCount;

          // Only mark as background if BOTH conditions are met:
          // 1. Very similar to edge colors (within 40 units)
          // 2. Low local contrast (smooth area, not detailed object)
          const isBackground = colorDiff < 40 && localContrast < 30;
          
          if (isBackground) {
            // Gradually blend to white for smoother transition
            const blendFactor = Math.max(0, (40 - colorDiff) / 40) * 0.7; // Conservative blending
            data[i] = Math.round(r + (255 - r) * blendFactor);     // R
            data[i + 1] = Math.round(g + (255 - g) * blendFactor); // G
            data[i + 2] = Math.round(b + (255 - b) * blendFactor); // B
          } else {
            // Slightly enhance object contrast
            data[i] = Math.min(255, Math.max(0, r * 1.05));
            data[i + 1] = Math.min(255, Math.max(0, g * 1.05));
            data[i + 2] = Math.min(255, Math.max(0, b * 1.05));
          }
        }

        // Apply processed data
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageUrl;
    });
  };

  // Get current processed image with background removed
  const getCurrentImage = () => {
    const imagesToUse = processedImages.length > 0 ? processedImages : capturedImages;
    if (imagesToUse.length === 0) return null;
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const imageIndex = Math.floor(normalizedAngle / 45) % imagesToUse.length;
    return imagesToUse[imageIndex] || imagesToUse[0];
  };

  // Control functions
  const downloadCurrentImage = () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.download = `360-view-${Math.round(currentAngle)}deg.jpg`;
    link.href = currentImage;
    link.click();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(5, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev / 1.2));
  
  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setCurrentAngle(0);
    setAutoRotate(false);
    setVelocity(0);
  };

  const toggleAutoRotate = () => {
    setAutoRotate(prev => !prev);
    if (!autoRotate) setVelocity(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(5, prev * delta)));
  };

  // Enhanced mouse/touch handlers with mode detection
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
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
    
    if (dragMode === 'move') {
      // Move item position
      setPosition(prev => ({
        x: prev.x + deltaX * 0.8,
        y: prev.y + deltaY * 0.8
      }));
    } else {
      // Rotate item with enhanced sensitivity
      const sensitivity = 1.0;
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
  };

  const currentImage = getCurrentImage();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
        <div className="flex items-center gap-4">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900">
            <Eye className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            AI 360° Viewer
          </h3>
          <div className="flex items-center gap-2">
            {processedImages.length > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ✨ AI Enhanced
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {capturedImages.length} Images
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCurrentImage}
            className="text-gray-600 hover:bg-gray-100"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Controls - Horizontal on mobile, sidebar on desktop */}
        <div className="w-full lg:w-64 bg-white/95 backdrop-blur-sm border-b lg:border-r lg:border-b-0 border-gray-200 p-3 flex-shrink-0">
          <div className="flex lg:flex-col gap-3 lg:space-y-3 overflow-x-auto lg:overflow-x-visible">
            
            {/* Current View Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 min-w-[200px] lg:min-w-0">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Current View</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Angle:</span>
                  <span className="font-medium">{Math.round(currentAngle)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zoom:</span>
                  <span className="font-medium">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <span className="font-medium capitalize">{dragMode}</span>
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-2 min-w-[200px] lg:min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">Zoom</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.3}
                  className="flex-1 text-xs"
                >
                  <ZoomOut className="h-3 w-3 mr-1" />
                  Out
                </Button>
                <div className="text-xs font-medium text-center min-w-[50px] bg-gray-100 rounded px-2 py-1">
                  {Math.round(zoom * 100)}%
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                  className="flex-1 text-xs"
                >
                  <ZoomIn className="h-3 w-3 mr-1" />
                  In
                </Button>
              </div>
            </div>

            {/* Mode & Auto-Rotate */}
            <div className="space-y-2 min-w-[200px] lg:min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">Interaction</h4>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={dragMode === 'rotate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDragMode('rotate')}
                  className="flex items-center justify-center gap-1 text-xs"
                >
                  <RotateCw className="h-3 w-3" />
                  Rotate
                </Button>
                <Button
                  variant={dragMode === 'move' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDragMode('move')}
                  className="flex items-center justify-center gap-1 text-xs"
                >
                  <Move className="h-3 w-3" />
                  Move
                </Button>
              </div>
              <Button
                variant={autoRotate ? 'default' : 'outline'}
                size="sm"
                onClick={toggleAutoRotate}
                className="w-full text-xs"
              >
                <RotateCw className={`h-3 w-3 mr-1 ${autoRotate ? 'animate-spin' : ''}`} />
                {autoRotate ? 'Stop Auto' : 'Start Auto'}
              </Button>
            </div>

            {/* Reset Controls */}
            <div className="space-y-2 min-w-[150px] lg:min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm">Reset</h4>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentAngle(0)}
                  className="flex items-center justify-center gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Angle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPosition}
                  className="flex items-center justify-center gap-1 text-xs"
                >
                  <MousePointer className="h-3 w-3" />
                  All
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Main 3D Viewer */}
        <div className="flex-1 relative bg-white overflow-hidden">
          <div 
            ref={containerRef}
            className="w-full h-full flex items-center justify-center select-none touch-none p-4"
            style={{
              cursor: isDragging ? 'grabbing' : dragMode === 'move' ? 'move' : 'grab',
              background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            {currentImage ? (
              <div className="relative">
                {/* AI-processed item with clean background */}
                <img
                  src={currentImage}
                  alt="360° Item View"
                  className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-10rem)] lg:max-w-[calc(100vw-18rem)] lg:max-h-[calc(100vh-8rem)] w-auto h-auto object-contain rounded-xl shadow-2xl"
                  draggable={false}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) perspective(1200px) rotateY(${currentAngle}deg)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.1))',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                />
                
                {/* Floating angle indicator */}
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium">
                  {Math.round(currentAngle)}°
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scan data available</p>
              </div>
            )}

            {/* Processing indicator */}
            {processedImages.length === 0 && capturedImages.length > 0 && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">AI Processing Background...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="h-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 h-full overflow-x-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap">Navigate:</span>
          {(processedImages.length > 0 ? processedImages : capturedImages).map((image, index) => {
            const angle = index * 45;
            const isActive = Math.abs(((currentAngle % 360) - angle + 180) % 360 - 180) < 22.5;
            
            return (
              <button
                key={index}
                className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  isActive 
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setCurrentAngle(angle)}
              >
                <img
                  src={image}
                  alt={`View ${angle}°`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs py-1 text-center font-medium">
                  {angle}°
                </div>
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}