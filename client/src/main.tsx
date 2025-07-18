import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";

// Add comprehensive error handling for production deployment issues
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise rejection details:', {
    reason: event.reason,
    stack: event.reason?.stack
  });
});

// Log environment info for debugging
console.log('App starting in environment:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  BASE_URL: import.meta.env.BASE_URL,
  hostname: window.location.hostname,
  pathname: window.location.pathname,
  href: window.location.href
});

try {
  // Register service worker for PWA notifications (with error handling)
  registerServiceWorker().catch((error) => {
    console.warn('Service worker registration failed:', error);
  });
} catch (error) {
  console.warn('Service worker registration error:', error);
}

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log('Rendering React app...');
  createRoot(rootElement).render(<App />);
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback: show error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        padding: 40px 20px; 
        text-align: center; 
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px);">
          <h1 style="margin: 0 0 20px 0; font-size: 2.5em;">lendibl</h1>
          <p style="margin: 0 0 15px 0; font-size: 1.2em;">App is loading...</p>
          <p style="margin: 0; opacity: 0.8; font-size: 0.9em;">Please wait a moment</p>
          <div style="margin-top: 20px;">
            <div style="
              width: 40px; 
              height: 40px; 
              border: 3px solid rgba(255,255,255,0.3); 
              border-top: 3px solid white; 
              border-radius: 50%; 
              animation: spin 1s linear infinite;
              margin: 0 auto;
            "></div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
    
    // Try to reload after 3 seconds
    setTimeout(() => {
      console.log('Attempting to reload page after error...');
      window.location.reload();
    }, 3000);
  }
}
