import { api } from './api';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  occasion?: string;
  pattern?: string;
  material?: string;
  image?: string;
}

function toProduct(raw: any): Product {
  return {
    id: String(raw.id || ''),
    name: raw.name || '',
    price: raw.price || 0,
    category: raw.category || '',
    brand: raw.brand || '',
    occasion: raw.occasion || raw.occasions?.[0] || '',
    pattern: raw.pattern || raw.patterns?.[0] || '',
    material: raw.material || raw.materials?.[0] || '',
    image: raw.image || raw.images?.[0] || '',
  };
}

export const productsService = {
  // Get all products from the read-only products API
  getAllProducts: async (params?: { limit?: number; page?: number }): Promise<Product[]> => {
    const res = await api.getProducts(params);
    return (res.items || []).map(toProduct);
  },

  // Get a single product by ID
  getProductById: async (id: string): Promise<Product | null> => {
    const product = await api.getProduct(id);
    return product ? toProduct(product) : null;
  },

  // Get products by category (server-side filter)
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const res = await api.getProducts({ category });
    return (res.items || []).map(toProduct);
  },

  // Get products by brand (server-side filter)
  getProductsByBrand: async (brand: string): Promise<Product[]> => {
    const res = await api.getProducts({ brand });
    return (res.items || []).map(toProduct);
  },
};

export default productsService;
