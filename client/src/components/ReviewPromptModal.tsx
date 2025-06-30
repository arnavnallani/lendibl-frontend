import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ReviewPrompt {
  id: number;
  bookingId: number;
  targetUserId: number;
  role: string;
  targetUser: {
    id: number;
    firstName: string;
    lastName: string;
  };
  item: {
    id: number;
    title: string;
  };
}

interface ReviewPromptModalProps {
  prompts: ReviewPrompt[];
  onClose: () => void;
}

export default function ReviewPromptModal({ prompts, onClose }: ReviewPromptModalProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentPrompt = prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex === prompts.length - 1;

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest('POST', '/api/reviews', reviewData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      // Mark prompt as handled
      markPromptedMutation.mutate(currentPrompt.id);
      
      if (isLastPrompt) {
        onClose();
      } else {
        // Move to next prompt
        setCurrentPromptIndex(prev => prev + 1);
        setRating(0);
        setComment('');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markPromptedMutation = useMutation({
    mutationFn: async (promptId: number) => {
      const response = await apiRequest('PUT', `/api/review-prompts/${promptId}/prompted`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-prompts'] });
    },
  });

  const dismissPromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      const response = await apiRequest('PUT', `/api/review-prompts/${promptId}/dismiss`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-prompts'] });
      
      if (isLastPrompt) {
        onClose();
      } else {
        // Move to next prompt
        setCurrentPromptIndex(prev => prev + 1);
        setRating(0);
        setComment('');
      }
    },
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      bookingId: currentPrompt.bookingId,
      revieweeId: currentPrompt.targetUserId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const handleDismiss = () => {
    dismissPromptMutation.mutate(currentPrompt.id);
  };

  const handleSkipAll = () => {
    // Dismiss all remaining prompts
    prompts.slice(currentPromptIndex).forEach(prompt => {
      dismissPromptMutation.mutate(prompt.id);
    });
    onClose();
  };

  if (!currentPrompt) return null;

  const targetName = `${currentPrompt.targetUser.firstName} ${currentPrompt.targetUser.lastName}`;
  const roleText = currentPrompt.role === 'renter' ? 'rented from' : 'rented to';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rate your experience</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {currentPromptIndex + 1} of {prompts.length}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              How was your experience with <span className="font-semibold">{targetName}</span>?
            </p>
            <p className="text-xs text-gray-500">
              Item you rented: "{currentPrompt.item.title}"
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredStar || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center">
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="flex-1"
            >
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={dismissPromptMutation.isPending}
            >
              Skip
            </Button>
          </div>

          {!isLastPrompt && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipAll}
                className="text-gray-500"
              >
                Skip all remaining
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}