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
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys
    };

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
      const errorText = await response.text();
      console.error('❌ Failed to save push subscription. Status:', response.status, 'Error:', errorText);
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
export async function registerPushOnLogin() {
  console.log('🚀 Starting push notification registration on login...');
  
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // First request permission
      if (Notification.permission === 'default') {
        console.log('📋 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ Notification permission not granted:', permission);
          return;
        }
        console.log('✅ Notification permission granted');
      }
      
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        console.log('🔧 Service worker ready, subscribing to push notifications...');
        const success = await subscribeToPushNotifications(registration);
        if (success) {
          console.log('✅ Push notification registration completed successfully');
        } else {
          console.log('❌ Push notification registration failed');
        }
      } else {
        console.log('❌ No service worker registration found');
      }
    } catch (error) {
      console.error('❌ Failed to register push on login:', error);
    }
  } else {
    console.log('❌ Push notifications not supported in this browser');
  }
}