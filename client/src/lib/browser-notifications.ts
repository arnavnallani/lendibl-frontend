// Browser notification service for desktop notifications
export class BrowserNotificationService {
  private static instance: BrowserNotificationService;

  static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  }

  async showNotification(title: string, options: {
    body?: string;
    icon?: string;
    url?: string;
    data?: any;
  }) {
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      data: options.data,
      requireInteraction: true, // Keep notification visible until user interacts
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    // Auto-close after 8 seconds
    setTimeout(() => {
      notification.close();
    }, 8000);

    return notification;
  }

  async showListingPublishedNotification(itemTitle: string, itemId: number) {
    return this.showNotification('Listing Published Successfully! 🎉', {
      body: `Your "${itemTitle}" listing is now live and available for rent.`,
      url: `/items/${itemId}`,
      data: { type: 'listing_published', itemId }
    });
  }
}

export const browserNotifications = BrowserNotificationService.getInstance();