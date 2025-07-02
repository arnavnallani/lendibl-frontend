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
    <header className="bg-white/97 backdrop-blur-xl shadow-xl border-b border-gray-200/60 sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
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
          <div className="flex items-center space-x-1 sm:space-x-3 lg:space-x-5">
            {/* Mode Toggle */}
            <div className="flex bg-gradient-to-r from-gray-100/80 to-gray-200/60 rounded-2xl p-0.5 sm:p-1 backdrop-blur-sm shadow-inner border border-gray-200/50">
              <Button
                variant={currentMode === "renter" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("renter")}
                className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-500 shadow-sm ${
                  currentMode === "renter" 
                    ? "bg-gradient-to-br from-primary-blue via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 border border-blue-500/30" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/90 hover:scale-105 hover:shadow-md border border-transparent"
                }`}
              >
                <span className="sm:hidden">Rent</span>
                <span className="hidden sm:inline">Rent Items</span>
              </Button>
              <Button
                variant={currentMode === "lister" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("lister")}
                className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-500 shadow-sm ${
                  currentMode === "lister" 
                    ? "bg-gradient-to-br from-primary-blue via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 border border-blue-500/30" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/90 hover:scale-105 hover:shadow-md border border-transparent"
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
                <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                  {/* Action Dashboard */}
                  <Link href="/action-dashboard">
                    <Button variant="ghost" className="h-9 w-9 sm:h-11 sm:w-11 lg:h-12 lg:w-12 p-0 bg-gradient-to-br from-gray-50/80 to-gray-100/60 hover:from-blue-50/80 hover:to-blue-100/60 hover:text-primary-blue rounded-xl transition-all duration-500 hover:scale-110 hover:shadow-lg group border border-gray-200/50 hover:border-blue-300/50">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:animate-pulse drop-shadow-sm" />
                    </Button>
                  </Link>

                  {/* Messages */}
                  <Link href="/messages">
                    <Button variant="ghost" className="h-9 w-9 sm:h-11 sm:w-11 lg:h-12 lg:w-12 p-0 bg-gradient-to-br from-gray-50/80 to-gray-100/60 hover:from-blue-50/80 hover:to-blue-100/60 hover:text-primary-blue rounded-xl transition-all duration-500 hover:scale-110 hover:shadow-lg group border border-gray-200/50 hover:border-blue-300/50">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:animate-pulse drop-shadow-sm" />
                    </Button>
                  </Link>


                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 border-2 border-gray-200/60 hover:shadow-lg hover:border-blue-300/60 transition-all duration-300 hover-lift relative sm:rounded-2xl rounded-full bg-gradient-to-br from-gray-50/60 to-gray-100/40 hover:from-blue-50/60 hover:to-blue-100/40 backdrop-blur-sm"
                    >
                      <Menu className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 sm:block hidden drop-shadow-sm" />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-blue via-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg relative ring-2 ring-white/50">
                        <span className="text-white font-bold text-xs sm:text-sm drop-shadow-sm">
                          {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'S'}
                        </span>
                        {unreadCount > 0 ? (
                          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gradient-to-br from-red-400 to-red-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
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
                <div className="text-gray-800 font-semibold ml-2 sm:ml-3 lg:ml-4 text-sm sm:text-base bg-gradient-to-r from-gray-50/60 to-gray-100/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
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
      <div className="md:hidden px-3 pb-3 border-t border-gray-100/60 bg-gradient-to-b from-white/50 to-gray-50/30 backdrop-blur-sm">
        <div className="relative w-full group pt-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-md border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-500 ring-1 ring-gray-100/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
