import { useState, useEffect, useRef } from 'react';
import { getProductImage } from '@/utils/productImage';

interface LazyImageProps {
  src?: string;
  alt: string;
  className?: string;
  productName?: string;
  productId?: string | number;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  productName,
  productId,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate the image URL - Uses CloudFront CDN if configured
  useEffect(() => {
    let imageUrl = '';

    if (src && src.startsWith('http')) {
      // Use getProductImage to convert S3 URLs to CloudFront CDN URLs
      const mockProduct: any = { image: src, id: productId, name: productName };
      imageUrl = getProductImage(mockProduct);
    } else if (productId) {
      // Generate CDN image URL from product ID
      const mockProduct: any = { id: productId, name: productName };
      imageUrl = getProductImage(mockProduct);
    }

    console.log('🖼️ LazyImage:', { 
      src: src ? src.substring(0, 50) : 'none', 
      productId, 
      imageUrl: imageUrl.substring(0, 60),
      isCDN: imageUrl.includes('cloudfront.net')
    });
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

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Image failed to load:', imgSrc);
    onError?.(e);
    // Production: Hide image on error (no fallbacks)
    setImgSrc('');
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
