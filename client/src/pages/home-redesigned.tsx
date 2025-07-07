import { useState, useEffect } from "react";
import { 
  Search, Sparkles, TrendingUp, Users, Shield, Zap, 
  ArrowRight, Star, MapPin, Calendar, Heart, Eye, 
  Grid, List, Filter, ChevronDown, Globe, Award 
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ItemWithDetails } from "@shared/schema";

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function HomeRedesigned() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentMode, setCurrentMode] = useState<"renter" | "lister">("renter");

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch items
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ["/api/items", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory.toString());
      if (searchQuery) params.append("search", searchQuery);
      
      const res = await apiRequest("GET", `/api/items?${params}`);
      return res.json();
    },
  });

  const items = itemsData?.items || [];

  // Fetch recommendations for logged-in users
  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/recommendations");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      <Header />
      
      {/* Hero Section - Redesigned */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-float"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Hero Content */}
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
                Rent
                <span className="gradient-text bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {" "}Anything
                </span>
                <br />
                From Anyone
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                The future of sharing is here. Discover, rent, and earn from the world's largest peer-to-peer marketplace.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-16 animate-slide-up">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white rounded-2xl p-2 shadow-2xl">
                  <div className="flex items-center">
                    <Search className="w-6 h-6 text-gray-400 ml-4" />
                    <Input
                      placeholder="Search for anything you need..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border-0 text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-slide-up">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">10k+</div>
                <div className="text-gray-600">Items Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">5k+</div>
                <div className="text-gray-600">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.9★</div>
                <div className="text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Redesigned */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Categories</h2>
            <p className="text-xl text-gray-600">Find exactly what you need from our diverse marketplace</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {categories.map((category, index) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover-lift group ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-xl'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Items Section - Redesigned */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header with View Controls */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {selectedCategory ? 'Filtered Results' : 'Featured Items'}
              </h2>
              <p className="text-gray-600">
                {items.length} items found
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-4"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-4"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Items Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`grid gap-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {items.map((item: ItemWithDetails, index: number) => (
                <Card 
                  key={item.id}
                  className="group cursor-pointer transition-all duration-300 hover-lift animate-fade-in border-0 shadow-lg hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    localStorage.setItem('homeScrollPosition', window.scrollY.toString());
                    setLocation(`/item/${item.id}`);
                  }}
                >
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-blue-600 border-0">
                        ${item.pricePerDay}/day
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium ml-1">
                            {item.owner?.rating || 4.8}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm ml-1">
                            {item.location?.city || 'Local'}
                          </span>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && items.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No items found</h3>
              <p className="text-gray-600 mb-8">Try adjusting your search or browse our categories</p>
              <Button onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations Section for Logged-in Users */}
      {user && recommendations.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                <Sparkles className="w-8 h-8 inline-block mr-2 text-blue-600" />
                Recommended for You
              </h2>
              <p className="text-xl text-gray-600">Personalized picks based on your interests</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.slice(0, 4).map((item: ItemWithDetails, index: number) => (
                <Card 
                  key={item.id}
                  className="group cursor-pointer transition-all duration-300 hover-lift animate-fade-in border-0 shadow-lg hover:shadow-2xl"
                  style={{ animationDelay: `${index * 150}ms` }}
                  onClick={() => {
                    localStorage.setItem('homeScrollPosition', window.scrollY.toString());
                    setLocation(`/item/${item.id}`);
                  }}
                >
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0">
                        Recommended
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        ${item.pricePerDay}/day
                      </span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium ml-1">
                          {item.owner?.rating || 4.8}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Lendibl?</h2>
            <p className="text-xl text-gray-300">The most trusted platform for peer-to-peer rentals</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Secure & Protected</h3>
              <p className="text-gray-300">Advanced security measures and insurance protection for every rental transaction.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Trusted Community</h3>
              <p className="text-gray-300">Join thousands of verified users in our growing marketplace community.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instant Booking</h3>
              <p className="text-gray-300">Book items instantly with our streamlined reservation and payment system.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}