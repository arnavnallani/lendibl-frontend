import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/lendibl_logo1_1750383971030.png";

interface HeaderProps {
  currentMode: "renter" | "lister";
  onModeChange: (mode: "renter" | "lister") => void;
  onSearch: (query: string) => void;
}

export default function Header({ currentMode, onModeChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="h-10 cursor-pointer"
              />
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
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

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            {/* Mode Toggle */}
            <div className="hidden sm:flex bg-gray-bg rounded-full p-1">
              <Button
                variant={currentMode === "renter" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("renter")}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  currentMode === "renter" 
                    ? "bg-white text-gray-dark shadow-sm" 
                    : "text-gray-medium hover:text-gray-dark"
                }`}
              >
                Rent Items
              </Button>
              <Button
                variant={currentMode === "lister" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("lister")}
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  currentMode === "lister" 
                    ? "bg-white text-gray-dark shadow-sm" 
                    : "text-gray-medium hover:text-gray-dark"
                }`}
              >
                <Link href="/list-item">List Items</Link>
              </Button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 p-2 border border-gray-light rounded-full hover:shadow-md transition-shadow"
              >
                <Menu className="h-4 w-4 text-gray-medium" />
                <div className="w-8 h-8 bg-gray-medium rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

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
