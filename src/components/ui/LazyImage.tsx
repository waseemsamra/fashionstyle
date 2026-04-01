import { useState, useEffect, useRef } from 'react';
import { getProductImage } from '@/utils/productImage';

interface LazyImageProps {
  src?: string;
  alt: string;
  className?: string;
  productName?: string;
  productId?: string | number;
  onLoad?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  productName,
  productId,
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate the image URL
  useEffect(() => {
    let imageUrl = '';
    
    if (src) {
      // If src is provided, use it directly
      imageUrl = src;
    } else if (productId || productName) {
      // Generate image from product info
      imageUrl = getProductImage({ id: productId, name: productName });
    } else {
      // Fallback placeholder
      imageUrl = `https://via.placeholder.com/300x400/f5f5dc/333333?text=${encodeURIComponent(productName || 'Product')}`;
    }
    
    console.log('🖼️ LazyImage:', { src, productId, productName, imageUrl });
    setImgSrc(imageUrl);
  }, [src, productName, productId]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    console.log('✅ Image loaded:', imgSrc.substring(0, 50));
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    console.error('❌ Image failed to load:', imgSrc);
    // Fallback to placeholder with product name
    const placeholder = `https://via.placeholder.com/300x400/f5f5dc/333333?text=${encodeURIComponent(productName || 'Product')}`;
    setImgSrc(placeholder);
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-beige-100 ${className}`}>
      {/* Placeholder background - shown immediately */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-beige-100 to-beige-200"
        style={{ opacity: isLoaded ? 0 : 1, transition: 'opacity 0.3s' }}
      />

      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? imgSrc : undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
