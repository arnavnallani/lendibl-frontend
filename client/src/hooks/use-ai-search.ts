import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';

export function useAISearch(query: string) {
  const debouncedQuery = useDebounce(query, 500);

  return useQuery({
    queryKey: ['/api/ai-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 3) return [];
      
      const response = await fetch(`/api/ai-search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache for AI results
    cacheTime: 15 * 60 * 1000, // 15 minutes in memory
  });
}