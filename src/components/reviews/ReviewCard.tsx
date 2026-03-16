import { useState } from 'react';
import { Star, ThumbsUp, Flag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Review } from '@/hooks/useReviews';
import { useMarkHelpful, useReportReview } from '@/hooks/useReviews';

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

export default function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const [isReported, setIsReported] = useState(false);
  const markHelpful = useMarkHelpful();
  const reportReview = useReportReview();

  const handleHelpful = () => {
    markHelpful.mutate({ reviewId: review.id });
    onHelpful?.(review.id);
  };

  const handleReport = () => {
    if (isReported) return;
    
    const reason = prompt('Please provide a reason for reporting this review:');
    if (reason) {
      reportReview.mutate({ reviewId: review.id, reason });
      setIsReported(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <span className="text-gold font-semibold">
                {review.customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{review.customerName}</span>
                {review.verified && (
                  <Badge className="bg-green-100 text-green-800 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {review.title && (
            <h4 className="font-semibold text-lg">{review.title}</h4>
          )}

          <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {review.images?.map((image: string, index: number) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHelpful}
              disabled={markHelpful.isPending}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful ({review.helpful})</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              disabled={isReported || reportReview.isPending}
              className="gap-2 text-gray-500"
            >
              <Flag className="w-4 h-4" />
              <span>{isReported ? 'Reported' : 'Report'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
