// utils/productAdapter.ts
export interface FrontendProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  sizes: string[];
  colors: string[];
  occasion: string;
  pattern: string;
  material: string;
  isFeatured: boolean;
  rating?: number;
  originalPrice?: number;
  isNew?: boolean;
  isSale?: boolean;
  stock?: number;
  sku?: string;
  materials?: string[];
  patterns?: string[];
  occasions?: string[];
  genders?: string[];
  [key: string]: any;
}

export function adaptProduct(backendProduct: any): FrontendProduct {
  console.log('🎯 Adapting product:', backendProduct);
  
  // Direct mapping since your API returns clean objects
  return {
    id: String(backendProduct.id || backendProduct.PK || ''),
    name: backendProduct.name || 'Unnamed Product',
    description: backendProduct.description || '',
    price: Number(backendProduct.price || 0),
    image: backendProduct.image || 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/placeholders/product-placeholder.jpg',
    images: backendProduct.image ? [backendProduct.image] : [],
    category: backendProduct.category || 'Uncategorized',
    brand: backendProduct.brand || '',
    sizes: Array.isArray(backendProduct.sizes) ? backendProduct.sizes : [],
    colors: Array.isArray(backendProduct.colors) ? backendProduct.colors : [],
    occasion: backendProduct.occasion || '',
    pattern: backendProduct.pattern || '',
    material: backendProduct.material || '',
    isFeatured: Boolean(backendProduct.isFeatured),
    rating: backendProduct.rating ? Number(backendProduct.rating) : undefined,
    // Additional fields
    originalPrice: backendProduct.originalPrice ? Number(backendProduct.originalPrice) : undefined,
    isNew: Boolean(backendProduct.isNew),
    isSale: Boolean(backendProduct.isSale),
    stock: backendProduct.stock ? Number(backendProduct.stock) : undefined,
    sku: backendProduct.sku || '',
    materials: Array.isArray(backendProduct.materials) ? backendProduct.materials : [],
    patterns: Array.isArray(backendProduct.patterns) ? backendProduct.patterns : [],
    occasions: Array.isArray(backendProduct.occasions) ? backendProduct.occasions : [],
    genders: Array.isArray(backendProduct.genders) ? backendProduct.genders : [],
    // Preserve all other fields
    ...backendProduct
  };
}

// Adapt multiple products
export function adaptProducts(data: any[]): FrontendProduct[] {
  if (!Array.isArray(data)) {
    console.warn('adaptProducts expected an array, got:', typeof data);
    return [];
  }
  
  return data
    .map(item => {
      try {
        return adaptProduct(item);
      } catch (error) {
        console.error('Failed to adapt product:', item, error);
        return null;
      }
    })
    .filter((product): product is FrontendProduct => product !== null);
}
