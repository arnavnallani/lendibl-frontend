import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";

// Add error handling for production deployment issues
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
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
  
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback: show error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>Loading Error</h1>
        <p>The application failed to load. Please refresh the page.</p>
        <p style="color: #666; font-size: 14px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    `;
  }
}
