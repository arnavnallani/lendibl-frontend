// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'lendibl-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event for notifications - works even when app is closed
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = { body: event.data.text() };
    }
  }

  const options = {
    body: notificationData.body || 'New lendibl notification',
    icon: '/icon-192.svg',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'lendibl', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Register for push notifications when service worker is activated
self.addEventListener('activate', async (event) => {
  console.log('Service Worker activated');
  
  // Take control of all pages immediately
  await self.clients.claim();
  
  // Wait a bit for the main thread to potentially register push notifications
  setTimeout(async () => {
    await registerPushSubscription();
  }, 1000);
});

async function registerPushSubscription() {
  if ('Notification' in self && 'PushManager' in self) {
    try {
      const registration = await self.registration;
      
      // Check if we already have a subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        console.log('Attempting to create push subscription...');
        
        // Subscribe to push notifications with the VAPID public key
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array('BEl62iUYgUivyIebhds3LIwzuAHAiQrNfVOfGyyqugUScaFMhBGqfVSzX6kA0xwexo1XLb2kON1x2LuOW0v2Gjo')
        });
        
        console.log('Push subscription created:', subscription);
        
        // Send subscription to server
        await saveSubscriptionToServer(subscription);
      } else {
        console.log('Push subscription already exists');
        // Still try to save it to server in case it wasn't saved before
        await saveSubscriptionToServer(existingSubscription);
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }
}

// Helper function to convert VAPID key
function urlB64ToUint8Array(base64String) {
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

// Save subscription to server
async function saveSubscriptionToServer(subscription) {
  try {
    // Get auth token from client
    const clients = await self.clients.matchAll();
    if (clients.length === 0) {
      console.log('No clients available to get auth token');
      return;
    }

    // Send message to client to get auth token
    clients[0].postMessage({ type: 'GET_AUTH_TOKEN' });
    
    // Wait for response (we'll implement this message handling in the client)
    return new Promise((resolve) => {
      const messageHandler = (event) => {
        if (event.data.type === 'AUTH_TOKEN_RESPONSE') {
          const token = event.data.token;
          if (token) {
            fetch('/api/push-subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(subscription)
            }).then(response => {
              console.log('Subscription saved to server:', response.ok);
              resolve(response.ok);
            }).catch(error => {
              console.error('Failed to save subscription:', error);
              resolve(false);
            });
          } else {
            console.log('No auth token available');
            resolve(false);
          }
          self.removeEventListener('message', messageHandler);
        }
      };
      
      self.addEventListener('message', messageHandler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        self.removeEventListener('message', messageHandler);
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    console.error('Error saving subscription to server:', error);
  }
}