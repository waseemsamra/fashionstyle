import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { searchService } from '@/services/searchService';
import { useState, useEffect } from 'react';

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  inStock?: boolean;
  onSale?: boolean;
}

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
  tags: string[];
  highlight?: {
    name?: string[];
    description?: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    sizes: Array<{ name: string; count: number }>;
    colors: Array<{ name: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  };
  suggestions: string[];
  didYouMean?: string[];
}

export function useSearchProducts(
  query: string,
  filters?: SearchFilters,
  options?: { enabled?: boolean }
) {
  const [searchTerm, setSearchTerm] = useState(query);
  const debouncedQuery = useDebounce(searchTerm, 300); // 300ms debounce
  
  // Update search term when query changes
  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery, filters],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        return { results: [], total: 0, facets: {}, suggestions: [] } as SearchResponse;
      }
      
      console.log(`🔍 Searching for: "${debouncedQuery}"`, filters);
      const response = await searchService.search({
        q: debouncedQuery,
        ...filters
      });
      return response as SearchResponse;
    },
    enabled: (options?.enabled ?? true) && debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching
  });

  return {
    ...searchQuery,
    searchTerm,
    setSearchTerm,
    isDebouncing: searchTerm !== debouncedQuery,
    hasQuery: debouncedQuery.length >= 3,
  };
}

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebounce(query, 200); // Faster for suggestions

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      console.log(`💡 Fetching suggestions for: "${debouncedQuery}"`);
      const response = await searchService.getSuggestions(debouncedQuery);
      return response.suggestions || [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

export function useSearchHistory() {
  const queryClient = useQueryClient();

  const addToHistory = (query: string) => {
    if (!query || query.length < 3) return;

    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const newHistory = [query, ...history.filter((q: string) => q !== query)].slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Update cache
    queryClient.setQueryData(['search-history'], newHistory);
  };

  const getHistory = (): string[] => {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
  };

  const clearHistory = () => {
    localStorage.removeItem('searchHistory');
    queryClient.setQueryData(['search-history'], []);
  };

  return {
    addToHistory,
    getHistory,
    clearHistory
  };
}

export function usePopularSearches() {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      console.log('🔥 Fetching popular searches...');
      const data = await searchService.getPopularSearches();
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache
  });
}
