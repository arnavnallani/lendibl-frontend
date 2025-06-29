import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function useReviewPrompts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/review-prompts'],
    queryFn: async () => {
      const response = await fetch('/api/review-prompts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch review prompts');
      }
      
      return response.json();
    },
    enabled: !!user,
    staleTime: 0, // Always check for fresh prompts
  });
}