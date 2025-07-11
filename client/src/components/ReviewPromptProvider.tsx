import { useState, useEffect } from 'react';
import ReviewPromptModal from './ReviewPromptModal';
import { useReviewPrompts } from '@/hooks/use-review-prompts';
import { useAuth } from '@/hooks/use-auth';

export default function ReviewPromptProvider() {
  const { user } = useAuth();
  const { data: prompts, isLoading } = useReviewPrompts();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && prompts && prompts.length > 0 && user) {
      setShowModal(true);
    }
  }, [prompts, isLoading, user]);

  if (!showModal || !prompts || prompts.length === 0) {
    return null;
  }

  return (
    <ReviewPromptModal
      prompts={prompts}
      onClose={() => setShowModal(false)}
    />
  );
}