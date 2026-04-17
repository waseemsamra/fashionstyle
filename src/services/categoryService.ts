// Fetch categories from the dedicated categories API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'https://wpswtrwvil.execute-api.us-east-1.amazonaws.com/prod';

export interface Category {
  id: string;
  name: string;
  image?: string;
  count?: number;
}

export const categoryService = {
  /**
   * Fetch all categories from the API
   */
  getAllCategories: async (): Promise<Category[]> => {
    try {
      console.log('📂 Fetching categories from API...');
      
      const response = await fetch(`${API_URL}/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Categories response:', data);
      
      // Handle different response structures
      if (data.categories && Array.isArray(data.categories)) {
        return data.categories.map((cat: any) => ({
          id: cat.id || cat.name || '',
          name: cat.name || '',
          image: cat.image || '',
          count: cat.count || 0,
        }));
      }
      
      if (Array.isArray(data)) {
        return data.map((cat: any) => ({
          id: cat.id || cat.name || '',
          name: cat.name || '',
          image: cat.image || '',
          count: cat.count || 0,
        }));
      }

      console.warn('🟡 Unexpected categories response structure:', data);
      return [];
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return [];
    }
  },

  /**
   * Fetch a single category by name
   */
  getCategoryByName: async (name: string): Promise<Category | null> => {
    try {
      const categories = await categoryService.getAllCategories();
      return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
      console.error('❌ Error fetching category by name:', error);
      return null;
    }
  },
};
