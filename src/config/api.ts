// src/config/api.ts
// API Configuration using environment variables

export const API_CONFIG = {
  // Main API (Original - Stable)
  apiBase: 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws',
  
  // Collections API (New - For Featured Products)
  collectionsApiUrl: 'https://mjkgf6edxstyzcohlg2agkoqwu0cxwsr.lambda-url.us-east-1.on.aws/',
  
    // Individual endpoints using main API
    brandsApi: 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws/brands',
    collectionsApi: 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws/collections',
    categoriesApi: 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws/categories',
    productsApi: 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws/products',
    reviewsApi: 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws/reviews',
  
    // Users API (separate Lambda function - working endpoint)
    usersApi: import.meta.env.VITE_USERS_API_URL || 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws',
  
  // Orders API (API Gateway URL - CORS enabled)
  ordersApi: import.meta.env.VITE_ORDERS_API_URL || 'https://r7pc3n32db.execute-api.us-east-1.amazonaws.com/prod',
  
    // Base API URL (fallback) - now uses unified endpoint
    baseApiUrl: import.meta.env.VITE_API_URL || 'https://3rctw6carzadrs3okoemb4ccvi0rzxqy.lambda-url.us-east-1.on.aws',
  
  // S3/Storage endpoints
  s3Bucket: import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v',
  s3Region: import.meta.env.VITE_S3_REGION || 'us-east-1',
  s3BaseUrl: import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
  uploadApiUrl: import.meta.env.VITE_UPLOAD_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod/generate-upload-url',
  cdnUrl: import.meta.env.VITE_CDN_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com',
};

// Order action helper functions
export const orderActions = {
  processOrder: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Processing' })
  }),
  
  shipOrder: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Shipped' })
  }),
  
  markDelivered: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Delivered' })
  }),
  
  readyForPickup: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Ready for Pickup' })
  }),
  
  markPending: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Pending' })
  }),
  
  cancelOrder: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Cancelled' })
  }),
  
  deleteOrder: (orderId: string) => fetch(`${API_CONFIG.ordersApi}/orders/${orderId}`, {
    method: 'DELETE'
  })
};

// Export individual endpoints for easy import
export const { apiBase, collectionsApiUrl, productsApi, collectionsApi, brandsApi, categoriesApi, reviewsApi, usersApi, ordersApi, baseApiUrl } = API_CONFIG;
export const { s3Bucket, s3Region, s3BaseUrl, uploadApiUrl, cdnUrl } = API_CONFIG;
