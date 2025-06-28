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

  async showBookingRequestNotification(renterName: string, itemTitle: string) {
    return this.showNotification('New Rental Request 📬', {
      body: `${renterName} wants to rent your ${itemTitle}`,
      url: '/action-dashboard',
      data: { type: 'booking_request' }
    });
  }

  async showBookingApprovedNotification(itemTitle: string) {
    return this.showNotification('Rental Request Approved ✅', {
      body: `Your request to rent ${itemTitle} has been approved!`,
      url: '/action-dashboard',
      data: { type: 'booking_approved' }
    });
  }

  async showBookingDeclinedNotification(itemTitle: string) {
    return this.showNotification('Rental Request Declined ❌', {
      body: `Your request to rent ${itemTitle} was declined`,
      url: '/',
      data: { type: 'booking_declined' }
    });
  }

  async showRentalStartedNotification(itemTitle: string, isOwner: boolean) {
    const title = 'Rental Period Started 🚀';
    const body = isOwner 
      ? `Rental of your ${itemTitle} has begun`
      : `Your rental of ${itemTitle} has begun`;
    
    return this.showNotification(title, {
      body,
      url: '/action-dashboard',
      data: { type: 'rental_started' }
    });
  }

  async showRentalEndedNotification(itemTitle: string, isOwner: boolean) {
    const title = 'Rental Completed 🏁';
    const body = isOwner 
      ? `Rental of your ${itemTitle} has ended`
      : `Your rental of ${itemTitle} has ended`;
    
    return this.showNotification(title, {
      body,
      url: '/action-dashboard',
      data: { type: 'rental_ended' }
    });
  }

  async showPaymentReceivedNotification(amount: string, itemTitle: string) {
    return this.showNotification('Payment Received 💰', {
      body: `You received ${amount} for renting out your ${itemTitle}`,
      url: '/action-dashboard',
      data: { type: 'payment_received' }
    });
  }
}

export const browserNotifications = BrowserNotificationService.getInstance();