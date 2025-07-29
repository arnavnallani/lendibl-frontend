// API configuration for different environments
export const getApiBaseUrl = (): string => {
  // Force Replit backend for all Vercel deployments and lendibl.com
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname === 'lendibl.com' || hostname === 'www.lendibl.com') {
      console.log('🔧 Forcing Replit backend for Vercel/custom domain deployment');
      return 'https://lendibl.replit.app';
    }
  }
  
  // Check for environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production fallback
  if (import.meta.env.PROD) {
    console.log('🚀 Production build detected, forcing Replit backend');
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
  hasViteApiUrl: !!import.meta.env.VITE_API_BASE_URL,
  viteApiUrl: import.meta.env.VITE_API_BASE_URL,
  isProd: import.meta.env.PROD,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});
