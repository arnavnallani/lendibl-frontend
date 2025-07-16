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

        // Subscribe to push notifications if supported and user is logged in
        if ('PushManager' in window && registration.pushManager) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            console.log('🔔 User is logged in, attempting push subscription...');
            await subscribeToPushNotifications(registration);
          } else {
            console.log('⚠️ User not logged in, skipping push subscription');
          }
        }
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    });
  }
}

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    console.log('🔔 Starting push notification subscription...');
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    
    // Always try to save the subscription (even if it exists) to ensure it's in the database
    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array('BEl62iUYgUivyIebhds3LIwzuAHAiQrNfVOfGyyqugUScaFMhBGqfVSzX6kA0xwexo1XLb2kON1x2LuOW0v2Gjo')
    });

    console.log('🔔 Push notification subscription ready:', subscription);
    
    // Send subscription to server
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('⚠️ No auth token available for push subscription');
      return false;
    }

    // Properly format the subscription data for the server
    const subscriptionJSON = subscription.toJSON();
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: subscriptionJSON.keys
    };

    console.log('📡 Subscription JSON:', subscriptionJSON);
    console.log('📡 Sending subscription to server:', subscriptionData);

    const response = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscriptionData)
    });
    
    console.log('📡 Server response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Push subscription saved successfully to server:', result);
      return true;
    } else {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = await response.text();
      }
      console.error('❌ Failed to save push subscription. Status:', response.status);
      console.error('❌ Error details:', errorDetails);
      return false;
    }
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return false;
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

// Helper function to convert VAPID key
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register push notification when user logs in
export async function registerPushOnLogin(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
    try {
      // Wait for service worker registration
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        // Register service worker if not already registered
        registration = await navigator.serviceWorker.register('/sw.js');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for registration
      }
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Create push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array('BEl62iUYgUivyIebhds3LIwzuAHAiQrNfVOfGyyqugUScaFMhBGqfVSzX6kA0xwexo1XLb2kON1x2LuOW0v2Gjo')
      });

      // Send to server
      const token = localStorage.getItem('auth_token');
      if (!token) return false;

      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
  return false;
}