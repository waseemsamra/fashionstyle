// S3 Bucket configuration
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || import.meta.env.VITE_CDN_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com';

// Helper function to get product image with S3 fallback
export const getProductImage = (product: { image?: string; name?: string; id?: string | number }, size: string = '300x400'): string => {
  const safeName = (product.name && product.name !== 'undefined') ? product.name : 'Product';
  
  // If product has an image URL, use it
  if (product.image && product.image !== 'undefined') {
    // If it's already a full URL, return as is
    if (product.image.startsWith('http')) {
      return product.image;
    }
    // If it's a relative path, prepend S3 URL
    return `${S3_BASE_URL}/${product.image}`;
  }
  
  // Generate local SVG placeholder as fallback
  const [w, h] = size.split('x');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect fill="#f5f5dc" width="${w}" height="${h}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="14" font-family="sans-serif">${encodeURIComponent(safeName)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Helper function to handle image error
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, name: string, size: string = '300x400') => {
  const target = e.currentTarget;
  const safeName = (name && name !== 'undefined') ? name : 'No Image';
  const [w, h] = size.split('x');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect fill="#f5f5dc" width="${w}" height="${h}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="14" font-family="sans-serif">${encodeURIComponent(safeName)}</text>
  </svg>`;
  target.src = `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Helper to get S3 asset URL
export const getS3AssetUrl = (key: string): string => {
  return `${S3_BASE_URL}/${key.replace(/^\//, '')}`;
};
