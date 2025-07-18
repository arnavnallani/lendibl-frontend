import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { BrowserNotificationProvider } from "@/hooks/use-browser-notifications";
import { AIBanner } from "@/components/ai-banner";
import { WhoWeAreBanner } from "@/components/who-we-are-banner";
import AiChatbot from "@/components/AiChatbot";
import ReviewPromptProvider from "@/components/ReviewPromptProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

import Home from "@/pages/home";
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
import EarlyAccess from "@/pages/early-access";
import NotFound from "@/pages/not-found";

function PreLaunchRouter() {
  return <EarlyAccess />;
}

function MarketplaceRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/early-access" component={EarlyAccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [location] = useLocation();
  const [showPreLaunch, setShowPreLaunch] = useState(false);

  // Check URL parameters for pre-launch screen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prelaunchParam = urlParams.get('prelaunch');
    const hash = window.location.hash;
    
    // Show pre-launch screen if specific parameters are found
    if (prelaunchParam === 'true' || 
        hash === '#prelaunch' ||
        location === '/early-access') {
      setShowPreLaunch(true);
    }
  }, [location]);

  // Listen for global pre-launch event
  useEffect(() => {
    const handleShowPreLaunch = () => setShowPreLaunch(true);
    window.addEventListener('showPreLaunch', handleShowPreLaunch);
    return () => window.removeEventListener('showPreLaunch', handleShowPreLaunch);
  }, []);

  // Show marketplace by default, pre-launch when specifically requested
  return showPreLaunch ? <PreLaunchRouter /> : <MarketplaceRouter />;
}

function App() {
  const auth = useAuthProvider();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <TooltipProvider>
            <BrowserNotificationProvider />
            <Toaster />
            <AIBanner />
            <WhoWeAreBanner />
            <Router />
            <AiChatbot />
            <ErrorBoundary>
              <ReviewPromptProvider />
            </ErrorBoundary>
          </TooltipProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
