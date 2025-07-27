// API configuration for different environments
export const getApiBaseUrl = (): string => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Detect if we're running on Vercel by checking the hostname
  const hostname = window.location.hostname;
  const isVercel = hostname.includes('vercel.app') || hostname.includes('lendibl.com');
  
  if (isVercel) {
    console.log('🚀 Detected Vercel deployment, using Replit backend');
    return 'https://lendibl.replit.app';
  }
  
  // Development fallback - same origin
  console.log('🔧 Using development mode (same origin)');
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('🌐 API Configuration:', {
  baseUrl: API_BASE_URL,
  hostname: window.location.hostname,
  environment: import.meta.env.MODE,
  hasViteApiUrl: !!import.meta.env.VITE_API_BASE_URL
});