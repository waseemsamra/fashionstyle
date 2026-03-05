import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  getFilters: async () => {
    const response = await axios.get(`${API_URL}/filters`);
    return response.data;
  },

  listProducts: async (params = {}) => {
    const response = await axios.get(`${API_URL}/products`, { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  },

  searchProducts: async (params: any) => {
    const response = await axios.get(`${API_URL}/search`, { params });
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/profile`);
    return response.data;
  },

  updateUserProfile: async (userId: string, profile: any) => {
    const response = await axios.put(`${API_URL}/users/${userId}/profile`, profile);
    return response.data;
  },

  createOrder: async (userId: string, orderData: any) => {
    const response = await axios.post(`${API_URL}/users/${userId}/orders`, orderData);
    return response.data;
  },

  getUserOrders: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/orders`);
    return response.data;
  },

  getOrder: async (userId: string, orderId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/orders/${orderId}`);
    return response.data;
  }
};
