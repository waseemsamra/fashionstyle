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
  private baseUrl = 'https://tmdoc0q5ij.execute-api.us-east-1.amazonaws.com';
  private abortController: AbortController | null = null;

  async search(params: SearchFilters): Promise<SearchResponse> {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.abortController = new AbortController();
    const token = localStorage.getItem('jwt_token');

    const url = new URL(`${this.baseUrl}/products/search`);
    Object.keys(params).forEach(key => {
      const value = params[key as keyof SearchFilters];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v: string) => {
            url.searchParams.append(`${key}[]`, v);
          });
        } else {
          url.searchParams.append(key, value.toString());
        }
      }
    });

    console.log('🔍 Searching:', url.toString());

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log('✅ Search returned', data.results?.length || 0, 'results');
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Search request aborted');
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
      throw error;
    }
  }

  async getSuggestions(query: string): Promise<{ suggestions: string[] }> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('💡 Fetching suggestions for:', query);
    
    const response = await fetch(
      `${this.baseUrl}/products/suggestions?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return { suggestions: [] };
    }

    const data = await response.json();
    console.log('✅ Got', data.suggestions?.length || 0, 'suggestions');
    
    return data;
  }

  async getPopularSearches(): Promise<{ searches: string[] }> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('🔥 Fetching popular searches...');
    
    const response = await fetch(`${this.baseUrl}/products/popular-searches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { searches: [] };
    }

    const data = await response.json();
    console.log('✅ Got', data.searches?.length || 0, 'popular searches');
    
    return data;
  }

  async logSearch(query: string, resultCount: number, clickedProductId?: string) {
    const token = localStorage.getItem('jwt_token');
    
    await fetch(`${this.baseUrl}/search/log`, {
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

  // Cancel current search request
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const searchService = new SearchService();
