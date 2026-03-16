// services/shopService.ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  onSale: boolean;
  isNew: boolean;
  tags: string[];
  sizes?: string[];
  colors?: string[];
  material?: string;
  occasion?: string;
  pattern?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  bannerImage?: string;
  parentId?: string;
  children?: Category[];
  productCount: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface ShopFilters {
  category?: string;
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  occasions?: string[];
  patterns?: string[];
  rating?: number;
  onSale?: boolean;
  inStock?: boolean;
  search?: string;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';

export interface PriceRange {
  min: number;
  max: number;
}

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

export const shopService = {
  getProducts: async (_filters: ShopFilters) => {
    return {
      products: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
      nextPage: undefined,
      facets: {},
    };
  },
  getFilterOptions: async (_category?: string) => {
    return {
      brands: [],
      sizes: [],
      colors: [],
      materials: [],
      occasions: [],
      patterns: [],
      priceRange: { min: 0, max: 1000 },
    };
  },
  getCategories: async () => [],
  getCategoryBySlug: async (_slug: string) => null,
  getCategoryBreadcrumbs: async (_categoryId: string) => [],
  getRelatedCategories: async (_categoryId: string) => [],
  searchProducts: async (_query: string, _filters?: ShopFilters) => ({}),
};
