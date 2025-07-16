import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, User, LogOut, Settings, Zap, MessageSquare, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import AuthModal from "./auth-modal";
import { DynamicSearch } from "./DynamicSearch";
import { NotificationsPanel, useNotificationCount } from "./notifications-panel";
import { useAuth } from "@/hooks/use-auth";
import { registerPushOnLogin } from "@/lib/pwa";
import logoImage from "@assets/lendibl_logo1_1750383971030.png";
import mobileLogoImage from "@assets/Image_Editor_1750901898287.png";

interface HeaderProps {
  currentMode: "renter" | "lister";
  onModeChange: (mode: "renter" | "lister") => void;
  onSearch: (query: string) => void;
}

export default function Header({ currentMode, onModeChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileScrolling, setIsMobileScrolling] = useState(false);

  const { user, logout } = useAuth();
  const unreadCount = useNotificationCount();
  const [location] = useLocation();

  // Check for reset token in URL and auto-open auth modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset-token');
    if (resetToken && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    // Auto-scroll to items section on search
    if (searchQuery.trim()) {
      setTimeout(() => {
        const itemsSection = document.getElementById('items-section');
        if (itemsSection) {
          itemsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-light sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              {/* Desktop Logo - shows on larger screens when there's enough space */}
              <img 
                src={logoImage} 
                alt="lendibl" 
                className="hidden lg:block h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
              {/* Mobile Logo - shows when space is limited */}
              <img 
                src={mobileLogoImage} 
                alt="lendibl" 
                className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Enhanced Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-12">
            <div className="relative w-full group">
              <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <DynamicSearch
                    value={searchQuery}
                    onChange={(value) => {
                      setSearchQuery(value);
                      onSearch(value);
                      // Auto-scroll to items section when first typing
                      if (value.trim() && value.length === 1) {
                        setTimeout(() => {
                          const itemsSection = document.getElementById('items-section');
                          if (itemsSection) {
                            itemsSection.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start' 
                            });
                          }
                        }, 100);
                      }
                    }}
                    placeholder="Search for anything..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Search Bar (Medium screens) */}
          <div className="hidden md:flex lg:hidden flex-1 max-w-xl mx-4">
            <div className="relative w-full group">
              <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <DynamicSearch
                    value={searchQuery}
                    onChange={(value) => {
                      setSearchQuery(value);
                      onSearch(value);
                      // Auto-scroll to items section when first typing
                      if (value.trim() && value.length === 1) {
                        setTimeout(() => {
                          const itemsSection = document.getElementById('items-section');
                          if (itemsSection) {
                            itemsSection.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'start' 
                            });
                          }
                        }, 100);
                      }
                    }}
                    placeholder="Search for anything..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-5">
            {/* Mode Toggle */}
            <div className="flex bg-gray-light/50 rounded-2xl p-1 backdrop-blur-sm gap-1">
              <Button
                variant={currentMode === "renter" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("renter")}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-500 ${
                  currentMode === "renter" 
                    ? "bg-gradient-to-r from-primary-blue to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 animate-pulse-glow" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <span className="sm:hidden">Rent</span>
                <span className="hidden sm:inline">Rent Items</span>
              </Button>
              <Link href="/list-item">
                <Button
                  variant={currentMode === "lister" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onModeChange("lister")}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-500 ${
                    currentMode === "lister" 
                      ? "bg-gradient-to-r from-primary-blue to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 animate-pulse-glow" 
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:scale-105"
                  }`}
                >
                  <span className="sm:hidden">List</span>
                  <span className="hidden sm:inline">List Items</span>
                </Button>
              </Link>
            </div>

            {user ? (
              <>
                {/* Action Icons */}
                <div className="flex items-center gap-1 sm:gap-1 lg:gap-2 -ml-1 sm:ml-0">
                  {/* Action Dashboard */}
                  <Link href="/action-dashboard">
                    <Button variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-0 glass hover:bg-primary-blue/20 hover:text-primary-blue rounded-2xl transition-all duration-500 hover:scale-110 hover:shadow-lg group">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:animate-pulse" />
                    </Button>
                  </Link>

                  {/* Messages */}
                  <Link href="/messages">
                    <Button variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-0 glass hover:bg-primary-blue/20 hover:text-primary-blue rounded-2xl transition-all duration-500 hover:scale-110 hover:shadow-lg group">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:animate-pulse" />
                    </Button>
                  </Link>


                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-2 border-2 border-gray-light hover:shadow-lg hover:border-primary-blue transition-all duration-300 hover-lift relative sm:rounded-2xl rounded-full -ml-1 sm:ml-0"
                    >
                      <Menu className="h-3 w-3 sm:h-4 sm:w-4 text-gray-medium sm:block hidden" />
                      <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-blue to-blue-600 rounded-full flex items-center justify-center shadow-md relative">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'S'}
                        </span>
                        {unreadCount > 0 ? (
                          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full border-1 sm:border-2 border-white"></div>
                        ) : null}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-dark">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-medium">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsNotificationsOpen(true)}>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 ml-auto">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          console.log('🧪 Starting manual push notification test...');
                          console.log('Current notification permission:', Notification.permission);
                          
                          // Check current permission status
                          if (Notification.permission === 'denied') {
                            alert('Notifications are blocked. To enable them in Safari:\n\n1. Go to Safari menu > Preferences > Websites\n2. Click "Notifications" in the left sidebar\n3. Find this website and change to "Allow"\n\nOR:\n1. Click Safari menu > Settings for This Website\n2. Change Notifications to "Allow"\n3. Refresh the page and try again');
                            return;
                          }
                          
                          // Request permission if not granted
                          if (Notification.permission !== 'granted') {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                              alert('Please allow notifications to test push notifications');
                              return;
                            }
                          }
                          
                          // Try to register push notifications directly
                          try {
                            // Get service worker registration
                            let registration = await navigator.serviceWorker.getRegistration();
                            if (!registration) {
                              registration = await navigator.serviceWorker.register('/sw.js');
                              await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                            
                            await navigator.serviceWorker.ready;
                            
                            // Helper function to convert base64 to Uint8Array
                            function urlB64ToUint8Array(base64String: string): Uint8Array {
                              const padding = '='.repeat((4 - base64String.length % 4) % 4);
                              const base64 = (base64String + padding)
                                .replace(/-/g, '+')
                                .replace(/_/g, '/');
                              const rawData = window.atob(base64);
                              const outputArray = new Uint8Array(rawData.length);
                              for (let i = 0; i < rawData.length; ++i) {
                                outputArray[i] = rawData.charCodeAt(i);
                              }
                              return outputArray;
                            }
                            
                            // Create subscription
                            const subscription = await registration.pushManager.subscribe({
                              userVisibleOnly: true,
                              applicationServerKey: urlB64ToUint8Array('BL3rHN5Zb_fIiGqdZz-DZvbDaSvsPw0sD0pFnBNhRf5Y82Yfb4MxOcAtvneR4o4m-EU3Kxa_of1w4gVCrpG6RE8')
                            });
                            
                            // Save to server
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch('/api/push-subscribe', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                endpoint: subscription.endpoint,
                                keys: subscription.toJSON().keys
                              })
                            });
                            
                            if (response.ok) {
                              alert('✅ Push notifications enabled successfully!');
                            } else {
                              alert('❌ Failed to save subscription to server');
                            }
                          } catch (error) {
                            alert('❌ Error: ' + error.message);
                          }

                          const token = localStorage.getItem('auth_token');
                          if (!token) {
                            alert('Authentication required - please log in');
                            return;
                          }

                          const response = await fetch('/api/push-test', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          
                          if (!response.ok) {
                            const error = await response.json();
                            console.error('Push test failed:', error);
                            alert(`Push test failed: ${error.error || 'Unknown error'}`);
                            return;
                          }

                          const result = await response.json();
                          console.log('Push test result:', result);
                          
                          if (result.success) {
                            alert('Push notification sent! Check your notifications.');
                          } else {
                            alert(`Push test failed: ${result.message}`);
                          }
                        } catch (error) {
                          console.error('Push test error:', error);
                          alert('Failed to send test notification');
                        }
                      }}
                    >
                      🔔 Test Push Notification
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Greeting Message - Rightmost Element */}
                <div className="text-gray-700 font-medium ml-1 sm:ml-2 lg:ml-3 text-sm sm:text-base">
                  Hey {user.firstName}!
                </div>
              </>
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 btn-primary text-white font-semibold px-6 py-2 rounded-xl hover-lift bg-[darkblue]"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Notifications Panel */}
      {user && (
        <NotificationsPanel 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {/* Mobile Search */}
      <div className="md:hidden px-3 pb-3">
        <div className="relative w-full group">
          <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <DynamicSearch
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  onSearch(value);
                  // Auto-scroll to items section when typing on mobile - only once
                  if (value.trim() && value.length === 1 && window.innerWidth < 768) {
                    // Multiple attempts to ensure scroll position sticks on mobile
                    const scrollToItems = () => {
                      const itemsSection = document.getElementById('items-section');
                      if (itemsSection) {
                        const headerHeight = 60;
                        const scrollPosition = itemsSection.offsetTop - headerHeight + 250; // Increased offset to show item cards
                        window.scrollTo(0, Math.max(0, scrollPosition));
                      }
                    };
                    
                    // Immediate scroll
                    scrollToItems();
                    
                    // Follow-up scrolls to prevent bounce-back
                    setTimeout(scrollToItems, 50);
                    setTimeout(scrollToItems, 150);
                    setTimeout(scrollToItems, 300);
                  }
                }}
                placeholder="Search for anything..."
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
