// services/api.ts
const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

// API Client with all methods for backwards compatibility
export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async post(endpoint: string, data?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async put(endpoint: string, data?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  
  async delete(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

// Simple API methods for products
export const api = {
  async listProducts(_filters?: any) {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.items || data.products || data || [];
    } catch (error) {
      console.error('❌ API Error (listProducts):', error);
      return [];
    }
  },

  async getProduct(id: string) {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = data.items || [];
      return items.find((p: any) => String(p.id) === String(id)) || null;
    } catch (error) {
      console.error('❌ API Error (getProduct):', error);
      return null;
    }
  },
};

export default api;
