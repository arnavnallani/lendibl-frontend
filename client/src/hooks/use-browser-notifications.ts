import { useEffect } from 'react';
import { useAuth } from './use-auth';
import { browserNotifications } from '@/lib/browser-notifications';

export function useBrowserNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Request notification permission when user is authenticated
    browserNotifications.requestPermission();

    // Set up WebSocket connection for real-time notifications
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to notification WebSocket');
      // Send user ID to associate with this connection
      socket.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          const notification = data.data;
          
          // Trigger browser notification based on type
          switch (notification.type) {
            case 'booking_request':
              await browserNotifications.showBookingRequestNotification(
                notification.message.split(' wants to rent')[0],
                notification.message.split('your ')[1]
              );
              break;
              
            case 'booking_approved':
              const itemTitle = notification.message.split('Your request to rent ')[1]?.split(' has been approved')[0];
              if (itemTitle) {
                await browserNotifications.showBookingApprovedNotification(itemTitle);
              }
              break;
              
            case 'booking_declined':
              const declinedItem = notification.message.split('Your request to rent ')[1]?.split(' was declined')[0];
              if (declinedItem) {
                await browserNotifications.showBookingDeclinedNotification(declinedItem);
              }
              break;
              
            case 'rental_started':
              const startedItem = notification.message.includes('your ') 
                ? notification.message.split('Rental of your ')[1]?.split(' has begun')[0]
                : notification.message.split('Your rental of ')[1]?.split(' has begun')[0];
              const isOwner = notification.message.includes('Rental of your ');
              if (startedItem) {
                await browserNotifications.showRentalStartedNotification(startedItem, isOwner);
              }
              break;
              
            case 'rental_ended':
              const endedItem = notification.message.includes('your ') 
                ? notification.message.split('Rental of your ')[1]?.split(' has ended')[0]
                : notification.message.split('Your rental of ')[1]?.split(' has ended')[0];
              const isItemOwner = notification.message.includes('Rental of your ');
              if (endedItem) {
                await browserNotifications.showRentalEndedNotification(endedItem, isItemOwner);
              }
              break;
              
            case 'payment_received':
              const amount = notification.message.match(/You received ([^)]+) for/)?.[1];
              const paymentItem = notification.message.split('for renting out your ')[1];
              if (amount && paymentItem) {
                await browserNotifications.showPaymentReceivedNotification(amount, paymentItem);
              }
              break;
              
            case 'listing_published':
              // Already handled in list-item page
              break;
          }
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('Disconnected from notification WebSocket');
    };

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, [user]);
}