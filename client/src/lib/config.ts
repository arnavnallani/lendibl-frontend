// API configuration for different environments
export const getApiBaseUrl = (): string => {
  // Force Replit backend for production builds
  if (import.meta.env.PROD) {
    console.log('🚀 Production build detected, forcing Replit backend');
    return 'https://lendibl.replit.app';
  }
  
  // Check for explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
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