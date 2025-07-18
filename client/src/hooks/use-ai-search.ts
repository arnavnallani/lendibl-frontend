import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';

export function useAISearch(query: string) {
  const debouncedQuery = useDebounce(query, 300); // Reduced debounce delay

  return useQuery({
    queryKey: ['/api/ai-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 3) return [];
      
      const response = await fetch(`/api/ai-search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}