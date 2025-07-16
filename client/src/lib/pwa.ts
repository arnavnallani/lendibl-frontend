// PWA Service Worker Registration with Push Notifications
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful:', registration);
        
        // Request notification permission for PWA
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        }

        // Subscribe to push notifications if supported
        if ('PushManager' in window && registration.pushManager) {
          await subscribeToPushNotifications(registration);
        }
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    });
  }
}

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return;
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BEl62iUYgUivyIebhd_XXXXX' // This would be your VAPID public key
    });

    console.log('Push notification subscription created:', subscription);
    
    // Send subscription to server
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.log('Push subscription failed:', error);
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