// PWA Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful:', registration);
        
        // Request notification permission for PWA
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    });
  }
}

// Check if app can be installed as PWA
export function checkPWAInstallPrompt() {
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    console.log('PWA install prompt available');
  });
  
  return {
    showInstallPrompt: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install outcome: ${outcome}`);
        deferredPrompt = null;
      }
    }
  };
}