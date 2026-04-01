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
    
    if (src && src.startsWith('http')) {
      // If src is provided and is a full URL, use it directly
      imageUrl = src;
    } else if (productId) {
      // Generate S3 image URL from product ID
      imageUrl = `https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/${productId}.jpg`;
    } else if (productName) {
      // Use Unsplash fashion image based on product name
      const lowerName = productName.toLowerCase();
      if (lowerName.includes('shirt') || lowerName.includes('t-shirt')) {
        imageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop';
      } else if (lowerName.includes('blazer') || lowerName.includes('jacket')) {
        imageUrl = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop';
      } else if (lowerName.includes('trouser') || lowerName.includes('pant')) {
        imageUrl = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop';
      } else if (lowerName.includes('dress')) {
        imageUrl = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop';
      } else {
        // Default fashion image
        imageUrl = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=600&fit=crop';
      }
    } else {
      // Default fashion image
      imageUrl = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=600&fit=crop';
    }
    
    console.log('🖼️ LazyImage:', { src, productId, productName, imageUrl: imageUrl.substring(0, 60) });
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
    // Fallback to generic fashion image from Unsplash
    setImgSrc('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=600&fit=crop');
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
