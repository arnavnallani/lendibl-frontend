import React from "react";

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
  console.log('App component started rendering');
  
  return React.createElement('div', {
    style: { 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { color: '#2563eb', fontSize: '2rem', marginBottom: '1rem' }
    }, 'lendibl - React Working!'),
    React.createElement('p', {
      key: 'subtitle',
      style: { color: '#666', marginBottom: '1rem' }
    }, 'This confirms React is rendering correctly'),
    React.createElement('div', {
      key: 'items',
      style: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }
    }, [
      React.createElement('h3', { key: 'item1' }, 'Test Item 1 - $25/day'),
      React.createElement('h3', { key: 'item2' }, 'Test Item 2 - $35/day')
    ])
  ]);
}

function BrowserNotificationProvider() {
  useBrowserNotifications();
  return null;
}

export default App;
