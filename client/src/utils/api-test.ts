// Test API connectivity for debugging Vercel deployment
export const testApiConnection = async () => {
  const apiBaseUrl = 'https://lendibl.replit.app';
  
  console.log('🔍 Testing API Connection...');
  console.log('Environment:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    hostname: window.location.hostname,
    origin: window.location.origin
  });

  try {
    console.log('Testing categories endpoint...');
    const response = await fetch(`${apiBaseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'include'
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Connection successful!', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('❌ API Response failed:', response.status, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }
  } catch (error: any) {
    console.error('❌ API Connection failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-test on load in production
if (import.meta.env.PROD) {
  setTimeout(() => {
    testApiConnection();
  }, 1000);
}