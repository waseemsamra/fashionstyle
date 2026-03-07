import { useState, useRef } from 'react';
import { Upload, X, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function VirtualTryOnPage() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 });
  const [overlayScale, setOverlayScale] = useState(1);
  const [overlayRotation, setOverlayRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const overlayFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOverlayImage(event.target?.result as string);
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

  const resetOverlay = () => {
    setOverlayPosition({ x: 50, y: 50 });
    setOverlayScale(1);
    setOverlayRotation(0);
  };

  const clearAll = () => {
    setUserPhoto(null);
    setOverlayImage(null);
    resetOverlay();
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-4">Virtual Try-On</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your photo and try on our latest fashion collection. See how different outfits look on you before making a purchase.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload User Photo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">1. Upload Your Photo</h2>
              <input
                ref={userFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUserPhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => userFileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-gold bg-gray-50 hover:bg-gold/5"
                variant="ghost"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Choose Photo</p>
                </div>
              </Button>
              {userPhoto && (
                <p className="text-xs text-green-600 mt-2 text-center">✓ Photo uploaded</p>
              )}
            </div>

            {/* Upload Clothing Overlay */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">2. Upload Clothing</h2>
              <input
                ref={overlayFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOverlayUpload}
                className="hidden"
              />
              <Button
                onClick={() => overlayFileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-gold bg-gray-50 hover:bg-gold/5"
                variant="ghost"
                disabled={!userPhoto}
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Choose Clothing</p>
                </div>
              </Button>
              {overlayImage && (
                <p className="text-xs text-green-600 mt-2 text-center">✓ Clothing uploaded</p>
              )}
              {!userPhoto && (
                <p className="text-xs text-gray-500 mt-2 text-center">Upload your photo first</p>
              )}
            </div>

            {/* Controls */}
            {userPhoto && overlayImage && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">3. Adjust Fit</h2>
                
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

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    onClick={resetOverlay}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Preview</h2>
                {userPhoto && (
                  <p className="text-sm text-gray-600">
                    Drag the clothing to adjust position
                  </p>
                )}
              </div>

              {!userPhoto ? (
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Upload className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">Upload your photo to get started</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={canvasRef}
                  className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-move"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
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
                    >
                      <img
                        src={overlayImage}
                        alt="Clothing overlay"
                        className="max-w-[300px] max-h-[300px] object-contain"
                        draggable={false}
                        style={{
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tips */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Tips for best results:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use a full-body photo for best results</li>
                      <li>Stand in good lighting</li>
                      <li>Adjust the size and rotation to match your body</li>
                      <li>Drag the clothing to position it correctly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Products Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-playfair font-bold mb-6 text-center">Try Our Popular Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Embroidered Lawn Suit', price: 89, image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-1.jpg' },
              { name: 'Chiffon Formal Dress', price: 149, image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-2.jpg' },
              { name: 'Silk Lehenga Set', price: 299, image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg' },
              { name: 'Cotton Kurti', price: 59, image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg' },
            ].map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-2">{product.name}</h3>
                  <p className="text-gold font-bold">${product.price}</p>
                  <Button 
                    className="w-full mt-3 text-xs"
                    onClick={() => {
                      setOverlayImage(product.image);
                      if (!userPhoto) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    Try On
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
