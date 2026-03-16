import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService } from '@/services/reviewsService';
import type { Review, ReviewFilters } from '@/services/reviewsService';

export type { Review, ReviewFilters };

/**
 * Hook to fetch product reviews
 * Features:
 * - Pagination support
 * - Filter by rating
 * - Sort by recent/helpful/rating
 */
export function useReviews(productId: string, filters: ReviewFilters = {}) {
  return useQuery({
    queryKey: ['reviews', productId, filters],
    queryFn: async () => {
      console.log(`📝 Fetching reviews for product ${productId}...`);
      const data = await reviewsService.getReviews(productId, {
        ...filters,
        limit: filters.limit || 10
      });
      return data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch review statistics
 * Features:
 * - Average rating
 * - Rating distribution
 * - Total count
 */
export function useReviewStats(productId: string) {
  return useQuery({
    queryKey: ['review-stats', productId],
    queryFn: async () => {
      console.log(`📊 Fetching review stats for product ${productId}...`);
      const data = await reviewsService.getReviewStats(productId);
      return data;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to submit a review
 * Features:
 * - Optimistic update
 * - Cache invalidation
 * - Stats refresh
 */
export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      rating: number;
      title: string;
      comment: string;
      images?: string[];
    }) => {
      return reviewsService.submitReview(productId, review);
    },
    onSuccess: () => {
      // Invalidate reviews cache
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', productId] });
      console.log('✅ Review submitted, cache invalidated');
    },
  });
}

/**
 * Hook to mark review as helpful
 * Features:
 * - Optimistic update
 * - Instant feedback
 */
export function useMarkHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId }: { reviewId: string }) => {
      return reviewsService.markHelpful(reviewId);
    },
    onMutate: async ({ reviewId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reviews'] });

      // Snapshot previous value
      const previousReviews = queryClient.getQueryData(['reviews']);

      // Optimistically update
      queryClient.setQueryData(['reviews'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            reviews: page.reviews.map((review: Review) =>
              review.id === reviewId
                ? { ...review, helpful: review.helpful + 1 }
                : review
            )
          }))
        };
      });

      return { previousReviews };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousReviews) {
        queryClient.setQueryData(['reviews'], context.previousReviews);
      }
      console.error('❌ Failed to mark review as helpful:', err);
    },
  });
}

/**
 * Hook to report a review
 * Features:
 * - Report submission
 * - Error handling
 */
export function useReportReview() {
  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      return reviewsService.reportReview(reviewId, reason);
    },
    onSuccess: () => {
      console.log('✅ Review reported successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to report review:', error);
    },
  });
}

/**
 * Prefetch reviews for multiple products
 * Features:
 * - Batch prefetch
 * - Background loading
 * - Smart caching
 */
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
