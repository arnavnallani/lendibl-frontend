// Custom fetch wrapper with no timeout constraints
export async function fetchWithoutTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Remove any signal/timeout constraints from the init object
  const cleanInit = { ...init };
  
  // Explicitly remove any timeout-related properties
  delete (cleanInit as any).signal;
  delete (cleanInit as any).timeout;
  
  console.log('🔄 Using fetchWithoutTimeout - no time constraints');
  
  return fetch(input, cleanInit);
}

// Override global fetch if needed
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Strip timeout constraints from all fetch calls
    const cleanInit = { ...init };
    delete (cleanInit as any).signal;
    delete (cleanInit as any).timeout;
    
    return originalFetch(input, cleanInit);
  };
}
