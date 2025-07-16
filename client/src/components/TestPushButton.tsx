import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TestPushButton() {
  const { toast } = useToast();

  const testPushNotification = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to test push notifications",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/push-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Notification Sent!",
          description: "Check your browser/device for the push notification",
        });
      } else {
        toast({
          title: "Push Test Failed",
          description: result.message || "Make sure you've granted notification permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Push test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={testPushNotification} variant="outline" size="sm">
      🔔 Test Push Notification
    </Button>
  );
}