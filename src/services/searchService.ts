const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';

export interface SearchFilters {
  q: string;
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
  page?: number;
  limit?: number;
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

class SearchService {
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const token = localStorage.getItem('jwt_token');
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilters];
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    console.log('🔍 Searching with params:', params.toString());

    const response = await fetch(`${API_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        results: [],
        total: 0,
        facets: {
          categories: [],
          brands: [],
          priceRanges: [],
          sizes: [],
          colors: [],
          ratings: []
        },
        suggestions: []
      };
    }

    return response.json();
  }

  async getSuggestions(query: string): Promise<{ suggestions: string[] }> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { suggestions: [] };
    }

    return response.json();
  }

  async getPopularSearches(): Promise<string[]> {
    const response = await fetch(`${API_URL}/search/popular`);
    
    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  async logSearch(query: string, resultCount: number, clickedProductId?: string) {
    const token = localStorage.getItem('jwt_token');
    
    await fetch(`${API_URL}/search/log`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        resultCount,
        clickedProductId,
        timestamp: new Date().toISOString()
      })
    });
  }
}

export const searchService = new SearchService();
