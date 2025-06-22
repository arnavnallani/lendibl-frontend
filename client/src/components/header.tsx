import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, User, LogOut, Settings, ClipboardList, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationBell from "./notification-bell";
import AuthModal from "./auth-modal";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@assets/lendibl_logo1_1750383971030.png";

interface HeaderProps {
  currentMode: "renter" | "lister";
  onModeChange: (mode: "renter" | "lister") => void;
  onSearch: (query: string) => void;
}

export default function Header({ currentMode, onModeChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-light sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-16">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="What would you like to rent today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-300 bg-gray-light/30 hover:bg-white hover:shadow-md"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-medium h-5 w-5" />
            </form>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-6">
            {/* Mode Toggle */}
            <div className="hidden sm:flex bg-gray-light/50 rounded-2xl p-1 backdrop-blur-sm">
              <Button
                variant={currentMode === "renter" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("renter")}
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300 pl-[0px] pr-[0px] pt-[0px] pb-[0px] ml-[2px] mr-[2px] ${
                  currentMode === "renter" 
                    ? "bg-primary-blue text-white shadow-lg hover:shadow-xl" 
                    : "text-gray-medium hover:text-gray-dark hover:bg-white/50"
                }`}
              >
                Rent Items
              </Button>
              <Button
                variant={currentMode === "lister" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("lister")}
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300 pl-[0px] pr-[0px] pt-[0px] pb-[0px] ml-[2px] mr-[2px] ${
                  currentMode === "lister" 
                    ? "bg-primary-blue text-white shadow-lg hover:shadow-xl" 
                    : "text-gray-medium hover:text-gray-dark hover:bg-white/50"
                }`}
              >
                <Link href="/list-item">List Items</Link>
              </Button>
            </div>

            {user ? (
              <>
                {/* Header Icons */}
                <div className="flex items-center gap-1">
                  {/* Action Dashboard */}
                  <Link href="/action-dashboard">
                    <Button variant="ghost" className="h-11 w-11 p-0 hover:bg-blue-50 hover:text-primary-blue rounded-xl transition-all duration-200">
                      <ClipboardList className="w-6 h-6" />
                    </Button>
                  </Link>

                  {/* Messages */}
                  <Link href="/messages">
                    <Button variant="ghost" className="h-11 w-11 p-0 hover:bg-blue-50 hover:text-primary-blue rounded-xl transition-all duration-200">
                      <MessageSquare className="w-6 h-6" />
                    </Button>
                  </Link>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-3 p-2 border-2 border-gray-light rounded-2xl hover:shadow-lg hover:border-primary-blue transition-all duration-300 hover-lift"
                    >
                      <Menu className="h-4 w-4 text-gray-medium" />
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-blue to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-4">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="What would you like to rent?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-light rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-medium h-5 w-5" />
        </form>
      </div>
    </header>
  );
}
