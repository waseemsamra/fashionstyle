export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  sortBy?: 'recent' | 'helpful' | 'rating';
  page?: number;
  limit?: number;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';

class ReviewsService {
  async getReviews(productId: string, filters: ReviewFilters = {}): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const token = localStorage.getItem('jwt_token');
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ReviewFilters];
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    console.log(`📝 Fetching reviews for product ${productId}...`);

    const response = await fetch(`${API_URL}/products/${productId}/reviews?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { reviews: [], total: 0, page: 1, totalPages: 1 };
    }

    const data = await response.json();
    console.log('✅ Reviews fetched:', data.reviews?.length || 0, 'reviews');
    
    return {
      reviews: data.reviews || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1
    };
  }

  async getReviewStats(productId: string): Promise<ReviewStats> {
    const token = localStorage.getItem('jwt_token');
    
    console.log(`📊 Fetching review stats for product ${productId}...`);

    const response = await fetch(`${API_URL}/products/${productId}/reviews/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    return response.json();
  }

  async submitReview(productId: string, review: {
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }): Promise<Review> {
    const token = localStorage.getItem('jwt_token');
    
    console.log('📝 Submitting review for product', productId);

    const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    return response.json();
  }

  async markHelpful(reviewId: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async reportReview(reviewId: string, reason: string): Promise<void> {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${API_URL}/reviews/${reviewId}/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to report review');
    }
  }
}

export const reviewsService = new ReviewsService();

export function prefetchReviews(
  queryClient: any,
  productIds: string[],
  filters: ReviewFilters = { limit: 5 }
) {
  console.log('🚀 Prefetching reviews for', productIds.length, 'products...');
  
  productIds.forEach(productId => {
    queryClient.prefetchQuery({
      queryKey: ['reviews', productId],
      queryFn: async () => {
        try {
          const data = await reviewsService.getReviews(productId, filters);
          console.log(`✅ Prefetched ${data.reviews.length} reviews for product ${productId}`);
          return data;
        } catch (error) {
          console.warn(`⚠️ Failed to prefetch reviews for product ${productId}:`, error);
          return { reviews: [], total: 0, page: 1, totalPages: 1 };
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    });
  });
}
