import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { AIBanner } from "@/components/ai-banner";
import { WhoWeAreBanner } from "@/components/who-we-are-banner";
import AiChatbot from "@/components/AiChatbot";
import ReviewPromptProvider from "@/components/ReviewPromptProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

import DebugHome from "@/pages/debug-home";
import ItemDetails from "@/pages/item-details";
import ListItem from "@/pages/list-item";
import MyProfile from "@/pages/my-profile";
import UserProfile from "@/pages/user-profile";
import Settings from "@/pages/settings";
import ActionDashboard from "@/pages/action-dashboard";
import Messages from "@/pages/messages";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms";
import WhoWeAre from "@/pages/WhoWeAre";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DebugHome} />
      <Route path="/item/:id" component={ItemDetails} />
      <Route path="/list-item" component={ListItem} />
      <Route path="/my-profile" component={MyProfile} />
      <Route path="/user/:id" component={UserProfile} />
      <Route path="/settings" component={Settings} />
      <Route path="/action-dashboard" component={ActionDashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/who-we-are" component={WhoWeAre} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App component rendering...');
  
  try {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px' }}>
          <h1 style={{ color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }}>lendibl - Ultra Minimal Test</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>If you see this, React is working!</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <h3>Test Item 1</h3>
              <p>$25/day</p>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <h3>Test Item 2</h3>
              <p>$35/day</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error in App component</h1>
        <p>{error.toString()}</p>
      </div>
    );
  }
}

function BrowserNotificationProvider() {
  useBrowserNotifications();
  return null;
}

export default App;
