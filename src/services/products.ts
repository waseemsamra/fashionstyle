import { apiClient } from './api';

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

export const productsService = {
  // Get all products
  getAllProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data.items || response.data.products || response.data || [];
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      // Try to fetch single product directly
      const response = await apiClient.get(`/products/${id}`);
      // Handle different response formats: { item: ... }, { product: ... }, or direct object
      const product = response.data.item || response.data.product || response.data;
      return product || null;
    } catch (error) {
      // Fallback to finding from list
      const products = await productsService.getAllProducts();
      return products.find(p => p.id === id) || null;
    }
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const products = await productsService.getAllProducts();
    return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  },

  // Get products by brand
  getProductsByBrand: async (brand: string): Promise<Product[]> => {
    const products = await productsService.getAllProducts();
    return products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
};

export default productsService;
