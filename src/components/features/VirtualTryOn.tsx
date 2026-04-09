import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, RotateCcw, Download, Sparkles, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performVirtualTryOn, isAIConfigured, trackAPIUsage } from '@/services/aiTryOnService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VirtualTryOnProps {
  productImage?: string;
  productName?: string;
}

type TryOnMode = 'manual' | 'ai';

export default function VirtualTryOn({ productImage, productName }: VirtualTryOnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TryOnMode>('manual');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 });
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayRotation, setOverlayRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // AI Try-On state
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiProgress, setAIProgress] = useState(0);
  const [aiProgressMessage, setAIProgressMessage] = useState('');
  const [aiResult, setAIResult] = useState<string | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiEnabled = isAIConfigured();

  // Load product image as overlay when dialog opens
  useEffect(() => {
    if (isOpen && productImage) {
      setOverlayImage(productImage);
    }
  }, [isOpen, productImage]);

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayImage) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - overlayPosition.x,
      y: e.clientY - overlayPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragStart.x) / rect.width) * 100;
    const y = ((e.clientY - dragStart.y) / rect.height) * 100;
    setOverlayPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!overlayImage) return;
    setIsDragging(true);
    const touch = e.touches[0];
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragStart({
        x: touch.clientX - (overlayPosition.x / 100) * rect.width,
        y: touch.clientY - (overlayPosition.y / 100) * rect.height
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((touch.clientX - dragStart.x) / rect.width) * 100;
    const y = ((touch.clientY - dragStart.y) / rect.height) * 100;
    setOverlayPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetOverlay = () => {
    setOverlayPosition({ x: 50, y: 50 });
    setOverlayScale(1);
    setOverlayRotation(0);
  };

  const downloadResult = () => {
    if (!canvasRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const userImg = new Image();
    const overlayImg = new Image();
    
    userImg.crossOrigin = 'anonymous';
    overlayImg.crossOrigin = 'anonymous';
    
    userImg.onload = () => {
      canvas.width = userImg.width;
      canvas.height = userImg.height;
      
      if (ctx) {
        // Draw user photo
        ctx.drawImage(userImg, 0, 0);
        
        // Draw overlay if exists
        if (overlayImage) {
          overlayImg.onload = () => {
            const overlayWidth = (overlayImg.width * overlayScale) / 2;
            const overlayHeight = (overlayImg.height * overlayScale) / 2;
            const x = (overlayPosition.x / 100) * canvas.width;
            const y = (overlayPosition.y / 100) * canvas.height;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((overlayRotation * Math.PI) / 180);
            ctx.drawImage(
              overlayImg,
              -overlayWidth / 2,
              -overlayHeight / 2,
              overlayWidth,
              overlayHeight
            );
            ctx.restore();
            
            // Download
            const link = document.createElement('a');
            link.download = `try-on-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
          overlayImg.src = overlayImage;
        }
      }
    };
    userImg.src = userPhoto || '';
  };

  const clearAll = () => {
    setUserPhoto(null);
    setOverlayImage(null);
    setAIResult(null);
    setAIError(null);
    resetOverlay();
  };

  const handleAITryOn = async () => {
    if (!userPhoto || !productImage) {
      setAIError('Please upload both your photo and select a product');
      return;
    }

    setIsAIProcessing(true);
    setAIProgress(0);
    setAIError(null);
    setAIResult(null);

    try {
      const result = await performVirtualTryOn(
        userPhoto,
        productImage,
        productName || 'clothing item',
        (progress) => {
          setAIProgress(progress.progress || 0);
          setAIProgressMessage(progress.message);
        }
      );

      if (result.success && result.imageUrl) {
        setAIResult(result.imageUrl);
        trackAPIUsage();
      } else {
        setAIError(result.error || 'AI processing failed. Please try again.');
      }
    } catch (error) {
      setAIError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-gold text-gold hover:bg-gold/10"
          onClick={() => setIsOpen(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Try On
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair flex items-center gap-2">
            Virtual Try-On
            {aiEnabled && (
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            )}
            {productName && <span className="text-sm font-normal text-gray-600 ml-2">- {productName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Mode Selector */}
          {aiEnabled && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={mode === 'ai' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setMode('ai')}
              >
                <Zap className="w-4 h-4 mr-2" />
                AI Try-On (Automatic)
              </Button>
              <Button
                variant={mode === 'manual' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setMode('manual')}
              >
                Manual Positioning
              </Button>
            </div>
          )}
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>How to use {mode === 'ai' ? 'AI Try-On' : 'Manual Mode'}:</strong>
              {mode === 'ai'
                ? ' Upload your photo and AI will automatically place the clothing on you. Takes 10-30 seconds.'
                : ' Upload your photo, then adjust the clothing overlay by dragging, resizing, or rotating it to fit perfectly.'}
            </p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Photo</TabsTrigger>
              <TabsTrigger value="camera">Use Camera</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUserPhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gold bg-gray-50 hover:bg-gold/5"
                variant="ghost"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload your photo</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP (Max 10MB)</p>
                </div>
              </Button>
            </TabsContent>

            <TabsContent value="camera" className="mt-4">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Camera access coming soon</p>
                <p className="text-sm text-gray-500">For now, please upload a photo from your gallery</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI Try-On Processing */}
          {mode === 'ai' && userPhoto && productImage && (
            <div className="space-y-4">
              {!isAIProcessing && !aiResult && !aiError && (
                <Button
                  onClick={handleAITryOn}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Try-On
                </Button>
              )}

              {isAIProcessing && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="relative inline-block">
                      <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-500 border-t-transparent"></div>
                      <Sparkles className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 text-lg font-medium text-gray-700">{aiProgressMessage}</p>
                    <Progress value={aiProgress} className="mt-2" />
                    <p className="text-sm text-gray-500 mt-2">This usually takes 10-30 seconds</p>
                  </div>
                </div>
              )}

              {aiResult && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={aiResult}
                      alt="AI Try-On Result"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `ai-try-on-${Date.now()}.png`;
                        link.href = aiResult;
                        link.click();
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Save Result
                    </Button>
                    <Button
                      onClick={handleAITryOn}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">❌ {aiError}</p>
                  <Button
                    onClick={handleAITryOn}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Canvas Area */}
          {userPhoto && mode === 'manual' && (
            <div className="space-y-4">
              <div
                ref={canvasRef}
                className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-move"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* User Photo */}
                <img
                  src={userPhoto}
                  alt="Your photo"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />

                {/* Clothing Overlay */}
                {overlayImage && (
                  <div
                    className="absolute"
                    style={{
                      left: `${overlayPosition.x}%`,
                      top: `${overlayPosition.y}%`,
                      transform: `translate(-50%, -50%) rotate(${overlayRotation}deg) scale(${overlayScale})`,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  >
                    <img
                      src={overlayImage}
                      alt="Clothing overlay"
                      className="max-w-[200px] max-h-[200px] object-contain"
                      draggable={false}
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                )}

                {/* Overlay placeholder if none */}
                {!overlayImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Upload className="w-12 h-12 mx-auto mb-2" />
                      <p>No clothing overlay selected</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Size</label>
                    <Slider
                      value={[overlayScale * 100]}
                      onValueChange={([value]) => setOverlayScale(value / 100)}
                      min={10}
                      max={300}
                      step={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">{Math.round(overlayScale * 100)}%</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Rotation</label>
                    <Slider
                      value={[overlayRotation]}
                      onValueChange={([value]) => setOverlayRotation(value)}
                      min={-180}
                      max={180}
                      step={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">{overlayRotation}°</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={resetOverlay}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Position
                  </Button>

                  <Button
                    onClick={downloadResult}
                    className="bg-gold text-white hover:bg-gold/90"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save Image
                  </Button>

                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Product Image Info */}
          {productImage && !userPhoto && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Upload your photo to try on this item</p>
              <div className="flex justify-center gap-4">
                <img
                  src={productImage}
                  alt={productName || 'Product'}
                  className="w-32 h-40 object-cover rounded-lg shadow-md"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
