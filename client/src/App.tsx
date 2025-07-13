import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { AIBanner } from "@/components/ai-banner";
import AiChatbot from "@/components/AiChatbot";
import ReviewPromptProvider from "@/components/ReviewPromptProvider";
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
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

function Router() {
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
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const auth = useAuthProvider();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <TooltipProvider>
          <BrowserNotificationProvider />
          <Toaster />
          <AIBanner />
          <Router />
          <AiChatbot />
          <ReviewPromptProvider />
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

function BrowserNotificationProvider() {
  useBrowserNotifications();
  return null;
}

export default App;
