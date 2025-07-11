import { useState, useEffect } from 'react';
import ReviewPromptModal from './ReviewPromptModal';
import { useReviewPrompts } from '@/hooks/use-review-prompts';
import { useAuth } from '@/hooks/use-auth';

export default function ReviewPromptProvider() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Create a test prompt to show every time app opens
  const testPrompts = user ? [{
    id: 1,
    bookingId: 1,
    targetUserId: 1,
    role: 'renter',
    targetUser: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
    },
    item: {
      id: 1,
      title: 'Transaction Item',
    },
  }] : [];

  useEffect(() => {
    if (user) {
      setShowModal(true);
    }
  }, [user]);

  if (!showModal || !user) {
    return null;
  }

  return (
    <ReviewPromptModal
      prompts={testPrompts}
      onClose={() => setShowModal(false)}
    />
  );
}