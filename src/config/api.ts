// src/config/api.ts
// API Configuration using environment variables

export const API_CONFIG = {
  // New Unified API Endpoint
  apiBase: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws',
  
  // Individual endpoints using unified API
  brandsApi: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/brands',
  collectionsApi: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/collections',
  categoriesApi: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/categories',
  productsApi: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/products',
  
  // Base API URL (fallback) - now uses unified endpoint
  baseApiUrl: import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws',
  
  // S3/Storage endpoints
  s3Bucket: import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v',
  s3Region: import.meta.env.VITE_S3_REGION || 'us-east-1',
  s3BaseUrl: import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
  uploadApiUrl: import.meta.env.VITE_UPLOAD_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod/generate-upload-url',
  cdnUrl: import.meta.env.VITE_CDN_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
};

// Export individual endpoints for easy import
export const { apiBase, productsApi, collectionsApi, brandsApi, categoriesApi, baseApiUrl } = API_CONFIG;
export const { s3Bucket, s3Region, s3BaseUrl, uploadApiUrl, cdnUrl } = API_CONFIG;
