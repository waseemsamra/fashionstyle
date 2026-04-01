// S3 Bucket configuration
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com';

// Fashion images for products (real Unsplash images)
const PRODUCT_IMAGES: Record<string, string> = {
  'shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop',
  't-shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
  'blazer': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
  'trousers': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop',
  'dress': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop',
  'jeans': 'https://images.unsplash.com/photo-1542272617-08f08630329e?w=500&h=600&fit=crop',
  'jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop',
  'skirt': 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop',
  'sweater': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop',
  'coat': 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=600&fit=crop',
};

// Get image based on product name/category
const getImageFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }
  // Default fashion image
  return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=600&fit=crop';
};

// Helper function to get product image with S3 fallback
export const getProductImage = (product: { image?: string; name?: string; id?: string | number; category?: string }, size: string = '300x400'): string => {
  // If product has an image URL, use it (ensure it has extension)
  if (product.image) {
    // If it's already a full URL, return as is (ensure it has extension)
    if (product.image.startsWith('http')) {
      // Add .jpg extension if missing
      if (!product.image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return product.image + '.jpg';
      }
      return product.image;
    }
    // If it's a relative path, prepend S3 URL
    return `${S3_BASE_URL}/${product.image}`;
  }

  // Try to get image from product name
  if (product.name) {
    return getImageFromName(product.name);
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
