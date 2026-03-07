// S3 Bucket configuration
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com';

// Helper function to get product image with S3 fallback
export const getProductImage = (product: { image?: string; name?: string; id?: string | number }, size: string = '300x400'): string => {
  // If product has an image URL, use it
  if (product.image) {
    // If it's already a full URL, return as is
    if (product.image.startsWith('http')) {
      return product.image;
    }
    // If it's a relative path, prepend S3 URL
    return `${S3_BASE_URL}/${product.image}`;
  }
  
  // Try to load from S3 using product ID
  if (product.id) {
    return `${S3_BASE_URL}/products/${product.id}.jpg`;
  }
  
  // Generate placeholder with product name as final fallback
  const name = product.name || 'Product';
  return `https://via.placeholder.com/${size}/f5f5dc/333333?text=${encodeURIComponent(name)}`;
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
