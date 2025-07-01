import { useState } from "react";
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
  const { user, logout } = useAuth();
  const unreadCount = useNotificationCount();
  const [location] = useLocation();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              {/* Desktop Logo - shows on larger screens when there's enough space */}
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="hidden lg:block h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
              {/* Mobile Logo - shows when space is limited */}
              <img 
                src={mobileLogoImage} 
                alt="Lendibl" 
                className="lg:hidden h-10 w-10 cursor-pointer hover:scale-105 transition-transform duration-300"
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
                      // Auto-scroll to items section when typing
                      if (value.trim()) {
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
                      // Auto-scroll to items section when typing
                      if (value.trim()) {
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
          <div className="flex items-center space-x-2 sm:space-x-5">
            {/* Mode Toggle */}
            <div className="flex bg-gray-light/50 rounded-2xl p-1 backdrop-blur-sm">
              <Button
                variant={currentMode === "renter" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("renter")}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-500 ${
                  currentMode === "renter" 
                    ? "bg-gradient-to-r from-primary-blue to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 animate-pulse-glow" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <span className="sm:hidden">Rent</span>
                <span className="hidden sm:inline">Rent Items</span>
              </Button>
              <Button
                variant={currentMode === "lister" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("lister")}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-500 ${
                  currentMode === "lister" 
                    ? "bg-gradient-to-r from-primary-blue to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 animate-pulse-glow" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/70 hover:scale-105"
                }`}
              >
                <Link href="/list-item">
                  <span className="sm:hidden">List</span>
                  <span className="hidden sm:inline">List Items</span>
                </Link>
              </Button>
            </div>

            {user ? (
              <>
                {/* Action Icons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Action Dashboard */}
                  <Link href="/action-dashboard">
                    <Button variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 p-0 glass hover:bg-primary-blue/20 hover:text-primary-blue rounded-2xl transition-all duration-500 hover:scale-110 hover:shadow-lg group">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
                    </Button>
                  </Link>

                  {/* Messages */}
                  <Link href="/messages">
                    <Button variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 p-0 glass hover:bg-primary-blue/20 hover:text-primary-blue rounded-2xl transition-all duration-500 hover:scale-110 hover:shadow-lg group">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse" />
                    </Button>
                  </Link>


                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-3 p-2 border-2 border-gray-light rounded-2xl hover:shadow-lg hover:border-primary-blue transition-all duration-300 hover-lift relative"
                    >
                      <Menu className="h-4 w-4 text-gray-medium" />
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-blue to-blue-600 rounded-full flex items-center justify-center shadow-md relative">
                        <span className="text-white font-semibold text-sm">
                          {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'S'}
                        </span>
                        {unreadCount > 0 ? (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
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
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Greeting Message - Rightmost Element */}
                <div className="text-gray-700 font-medium ml-2 sm:ml-3 text-sm sm:text-base">
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
      <div className="md:hidden px-4 pb-4">
        <div className="relative w-full group">
          <div className="relative overflow-hidden rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <DynamicSearch
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  onSearch(value);
                  // Auto-scroll to items section when typing
                  if (value.trim()) {
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
    </header>
  );
}
