// Smart API configuration for deployment
const isVercel = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname === 'lendibl.com' ||
   window.location.hostname.includes('your-custom-domain.com'));

const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname.includes('replit.dev'));

export const config = {
  apiBaseUrl: isVercel 
    ? 'https://lendibl.replit.app'  // Force Replit backend for Vercel/custom domains
    : '',  // Same-origin for development
  
  // Debug logging
  debug: !isDevelopment
};

// Debug logging for troubleshooting
if (typeof window !== 'undefined' && config.debug) {
  console.log('🔧 Forcing Replit backend for Vercel/custom domain deployment');
  console.log('🌐 API Base URL:', config.apiBaseUrl);
  console.log('🏠 Current hostname:', window.location.hostname);
}
