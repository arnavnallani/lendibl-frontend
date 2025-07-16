import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';

export function SafariNotificationHelper() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detect Safari
    const userAgent = navigator.userAgent;
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsSafari(isSafariBrowser);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const testNotification = async () => {
    try {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
          new Notification('Test Notification', {
            body: 'Push notifications are working!',
            icon: '/favicon.ico'
          });
        }
      } else if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'Push notifications are working!',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Notification test failed:', error);
    }
  };

  if (!('Notification' in window)) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This browser doesn't support notifications.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <span className="text-sm">
            Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not Set'}
          </span>
        </div>

        {permission === 'denied' && isSafari && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Safari Instructions:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                <li>Go to Safari menu → Preferences → Websites</li>
                <li>Click "Notifications" in the left sidebar</li>
                <li>Find this website and change to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {permission === 'denied' && !isSafari && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Chrome/Firefox Instructions:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                <li>Click the lock icon (🔒) in the address bar</li>
                <li>Change notifications from "Block" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={testNotification} 
          className="w-full"
          disabled={permission === 'denied'}
        >
          {permission === 'default' ? 'Enable Notifications' : 'Test Notification'}
        </Button>

        {permission === 'granted' && (
          <p className="text-sm text-green-600 text-center">
            ✅ Notifications are working! You'll receive push notifications for rental updates.
          </p>
        )}
      </CardContent>
    </Card>
  );
}