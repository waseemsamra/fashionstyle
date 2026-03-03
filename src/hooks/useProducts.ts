import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const useFilters = () => {
  return useQuery({ queryKey: ['filters'], queryFn: api.getFilters });
};

export const useProducts = (category?: string, brand?: string) => {
  return useQuery({
    queryKey: ['products', category, brand],
    queryFn: () => api.listProducts({ category, brand })
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id
  });
};

export const useSearch = (query: string, filters = {}, page = 1) => {
  return useQuery({
    queryKey: ['search', query, filters, page],
    queryFn: () => api.searchProducts({ q: query, ...filters, page }),
    enabled: query.length >= 3
  });
};
