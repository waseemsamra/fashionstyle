// src/config/api.ts
// API Configuration using environment variables

export const API_CONFIG = {
  // API Endpoints using environment variables
  productsApi: import.meta.env.VITE_PRODUCTS_API?.replace('/products', '') || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod',
  collectionsApi: import.meta.env.VITE_COLLECTIONS_API || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections',
  brandsApi: 'https://q6dfid542cbp3avmsvdvvnpbyu0wgibu.lambda-url.us-east-1.on.aws/brands',
  categoriesApi: import.meta.env.VITE_CATEGORIES_API || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/categories',
  
  // Base API URL (fallback)
  baseApiUrl: import.meta.env.VITE_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod',
  
  // S3/Storage endpoints
  s3Bucket: import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v',
  s3Region: import.meta.env.VITE_S3_REGION || 'us-east-1',
  s3BaseUrl: import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
  uploadApiUrl: import.meta.env.VITE_UPLOAD_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod/generate-upload-url',
  cdnUrl: import.meta.env.VITE_CDN_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
};

// Export individual endpoints for easy import
export const { productsApi, collectionsApi, brandsApi, categoriesApi, baseApiUrl } = API_CONFIG;
export const { s3Bucket, s3Region, s3BaseUrl, uploadApiUrl, cdnUrl } = API_CONFIG;
