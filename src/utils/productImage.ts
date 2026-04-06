// S3 Bucket configuration - Use the correct bucket from .env
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com';

// Helper function to get product image - S3 ONLY for production
export const getProductImage = (product: { image?: string; images?: string[]; name?: string; id?: string | number; category?: string }): string => {
  // Priority 1: Use image URL from API (already a valid S3 URL)
  if (product.image && product.image.startsWith('http')) {
    return product.image;
  }

  // Priority 2: Check images array
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    if (firstImage && firstImage.startsWith('http')) {
      return firstImage;
    }
  }

  // Priority 3: Build S3 URL from product ID
  if (product.id) {
    return `https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/${product.id}.jpg`;
  }

  // Fallback: return placeholder
  return `https://via.placeholder.com/300x400/f5f5dc/333333?text=${encodeURIComponent(product.name || 'No Image')}`;
};

// Helper function to handle image error
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, name: string, size: string = '300x400') => {
  const target = e.currentTarget;
  // Only replace with placeholder if not already using placeholder
  if (!target.src.includes('via.placeholder.com')) {
    target.src = `https://via.placeholder.com/${size}/f5f5dc/333333?text=${encodeURIComponent(name)}`;
  }
};

// Helper to get S3 asset URL
export const getS3AssetUrl = (key: string): string => {
  return `${S3_BASE_URL}/${key.replace(/^\//, '')}`;
};
