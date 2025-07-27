export async function testConnection() {
  console.log('🔍 Testing connection to backend...');
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const testUrl = `${baseUrl}/api/categories`;
  
  console.log('🌐 Testing URL:', testUrl);
  console.log('🔧 Environment variables:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  });
  
  try {
    // Test 1: Simple fetch without credentials
    console.log('📡 Test 1: Simple fetch...');
    const simpleResponse = await fetch(testUrl);
    console.log('✅ Simple fetch status:', simpleResponse.status);
    
    // Test 2: Fetch with CORS
    console.log('📡 Test 2: Fetch with CORS...');
    const corsResponse = await fetch(testUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log('✅ CORS fetch status:', corsResponse.status);
    
    // Test 3: Fetch with credentials
    console.log('📡 Test 3: Fetch with credentials...');
    const credentialResponse = await fetch(testUrl, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Credential fetch status:', credentialResponse.status);
    
    const data = await credentialResponse.json();
    console.log('✅ Response data:', data);
    
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Connection test failed:', {
      error: error.message,
      name: error.name,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Auto-run test when in development
if (import.meta.env.DEV) {
  console.log('🚀 Auto-running connection test...');
  testConnection();
}