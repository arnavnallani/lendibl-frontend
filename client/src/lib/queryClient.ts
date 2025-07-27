import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let error: any;
    
    try {
      // Try to parse as JSON first
      const jsonError = JSON.parse(text);
      error = new Error(jsonError.message || `${res.status}: ${res.statusText}`);
      error.data = jsonError;
      error.status = res.status;
    } catch {
      // Fallback to plain text error
      error = new Error(`${res.status}: ${text}`);
      error.status = res.status;
    }
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  
  // Determine the correct base URL for API requests
  let baseUrl = '';
  if (import.meta.env.VITE_API_BASE_URL) {
    baseUrl = import.meta.env.VITE_API_BASE_URL;
  } else if (import.meta.env.PROD) {
    // Production fallback to Replit backend
    baseUrl = 'https://lendibl.replit.app';
  }
  
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  // Ensure HTTPS for security
  const secureUrl = fullUrl.replace(/^http:/, 'https:');
  
  // Enhanced debug logging for Vercel deployment
  console.log('🔗 API Request Debug:', {
    method,
    originalUrl: url,
    baseUrl,
    fullUrl,
    secureUrl,
    hasToken: !!token,
    environment: import.meta.env.MODE
  });
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Use longer timeout for item updates since they involve database operations
  const isItemUpdate = method === 'PUT' && url.includes('/api/items/');
  const timeout = isItemUpdate ? 10000 : 5000; // 10 seconds for updates, 5 for others
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(secureUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Important for cross-origin authentication
      mode: "cors", // Explicitly enable CORS
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('🚨 API Request Failed:', {
      method,
      fullUrl,
      secureUrl,
      error: error.message,
      errorName: error.name,
      environment: import.meta.env.MODE
    });
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout (${timeout}ms) - please try again`);
    }
    
    // Enhanced error information for debugging
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${fullUrl}`);
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth_token');
    
    // Determine the correct base URL for API requests
    let baseUrl = '';
    if (import.meta.env.VITE_API_BASE_URL) {
      baseUrl = import.meta.env.VITE_API_BASE_URL;
    } else if (import.meta.env.PROD) {
      // Production fallback to Replit backend
      baseUrl = 'https://lendibl.replit.app';
    }
    
    const url = typeof queryKey[0] === 'string' ? queryKey[0] : '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    // Ensure HTTPS for security
    const secureUrl = fullUrl.replace(/^http:/, 'https:');
    
    // Create AbortController for timeout - reduced to 5 seconds for faster failures
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const res = await fetch(secureUrl, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        credentials: "include", // Important for cross-origin authentication
        mode: "cors", // Explicitly enable CORS
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      console.error('🚨 Query Failed:', {
        fullUrl,
        secureUrl,
        error: error.message,
        errorName: error.name,
        status: error.status,
        environment: import.meta.env.MODE
      });
      
      if (error.name === 'AbortError') {
        console.warn('⏰ Query timeout for:', fullUrl);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Request timeout - please try again');
      }
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error: any) => {
        // More aggressive retry for Vercel deployment issues
        if (failureCount >= 3) return false;
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) return false;
        // Don't retry on not found errors
        if (error?.status === 404) return false;
        // Retry on network errors and timeouts
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
