// Test script to debug API connectivity
const testAPI = async () => {
  try {
    console.log('Testing backend connectivity...');
    
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('https://lendibl.replit.app/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('Health Response status:', healthResponse.status);
    console.log('Health Response headers:', Object.fromEntries(healthResponse.headers.entries()));
    
    // Test API endpoint
    console.log('2. Testing API endpoint...');
    const response = await fetch('https://lendibl.replit.app/api/items', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('API Response status:', response.status);
    console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
    
    // Test categories endpoint
    console.log('3. Testing categories endpoint...');
    const categoriesResponse = await fetch('https://lendibl.replit.app/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('Categories Response status:', categoriesResponse.status);
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('Categories data:', categoriesData);
    }
    
    // Test health endpoint
    console.log('4. Testing health endpoint...');
    const healthAPIResponse = await fetch('https://lendibl.replit.app/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('Health API Response status:', healthAPIResponse.status);
    
    if (healthAPIResponse.ok) {
      const healthData = await healthAPIResponse.json();
      console.log('Health data:', healthData);
    }
    
    // Test debug endpoint
    console.log('5. Testing debug endpoint...');
    const debugResponse = await fetch('https://lendibl.replit.app/api/debug/items', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('Debug Response status:', debugResponse.status);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Debug data:', debugData);
    } else {
      const debugError = await debugResponse.text();
      console.log('Debug error:', debugError);
    }
    
    // Test listings endpoint
    console.log('6. Testing listings endpoint...');
    const minimalResponse = await fetch('https://lendibl.replit.app/api/listings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    console.log('Minimal Items Response status:', minimalResponse.status);
    
    if (minimalResponse.ok) {
      const minimalData = await minimalResponse.json();
      console.log('Minimal Items data length:', minimalData.length);
      console.log('First item:', minimalData[0]);
    } else {
      const minimalError = await minimalResponse.text();
      console.log('Minimal Items error:', minimalError);
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
};

testAPI();