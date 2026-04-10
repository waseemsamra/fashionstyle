// S3 Bucket configuration - Use CloudFront CDN if available, fallback to S3
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com';
const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || S3_BASE_URL; // Use CloudFront if configured

// Helper function to get product image - CDN/S3 optimized
export const getProductImage = (product: { image?: string; images?: string[]; name?: string; id?: string | number; category?: string }): string => {
  // Priority 1: Use image URL from API (already a valid CDN/S3 URL)
  if (product.image && product.image.startsWith('http')) {
    // Convert S3 URLs to CDN URLs if CDN is configured
    if (CDN_BASE_URL !== S3_BASE_URL && product.image.includes('fashionstore-products-1773891614v.s3')) {
      return product.image.replace(S3_BASE_URL, CDN_BASE_URL);
    }
    return product.image;
  }

  // Priority 2: Check images array
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage && firstImage.startsWith('http')) {
      // Convert S3 URLs to CDN URLs if CDN is configured
      if (CDN_BASE_URL !== S3_BASE_URL && firstImage.includes('fashionstore-products-1773891614v.s3')) {
        return firstImage.replace(S3_BASE_URL, CDN_BASE_URL);
      }
      return firstImage;
    }
  }

  // Priority 3: Build CDN/S3 URL from product ID
  if (product.id) {
    return `${CDN_BASE_URL}/${product.id}.jpg`;
  }

  // Fallback: return placeholder
  return `https://via.placeholder.com/300x400/f5f5dc/333333?text=${encodeURIComponent(product.name || 'No Image')}`;
};

// Helper function to handle image error with lazy loading support
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, name: string, size: string = '300x400') => {
  const target = e.currentTarget;
  // Only replace with placeholder if not already using placeholder
  if (!target.src.includes('via.placeholder.com')) {
    console.warn(`⚠️ Failed to load image: ${target.src}`);
    target.src = `https://via.placeholder.com/${size}/f5f5dc/333333?text=${encodeURIComponent(name)}`;
  }
};

// Helper to get CDN/S3 asset URL
export const getAssetUrl = (key: string): string => {
  return `${CDN_BASE_URL}/${key.replace(/^\//, '')}`;
};

// Helper to get S3 asset URL (legacy support)
export const getS3AssetUrl = (key: string): string => {
  return `${S3_BASE_URL}/${key.replace(/^\//, '')}`;
};
