import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Check, X } from 'lucide-react';

export function NotificationPermissionChecker() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setShowAlert(Notification.permission === 'denied');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowAlert(result === 'denied');
    }
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Notifications not set';
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {getPermissionIcon()}
        <span>{getPermissionText()}</span>
      </div>
      
      {showAlert && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Notifications are blocked. To enable push notifications:
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Click the lock icon (🔒) in your browser address bar</li>
              <li>Change notifications from "Block" to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      {permission === 'default' && (
        <Button onClick={requestPermission} size="sm" variant="outline">
          Enable Notifications
        </Button>
      )}
    </div>
  );
}