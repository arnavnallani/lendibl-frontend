import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ItemCard from "@/components/item-card";
import { api } from "@/lib/api";
import type { ItemWithDetails } from "@shared/schema";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: userItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items", { ownerId: parseInt(id!) }],
    queryFn: () => api.getItems({ ownerId: parseInt(id!) }),
    enabled: !!id,
  });

  const { data: userInfo, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", parseInt(id!)],
    queryFn: () => api.getUser(parseInt(id!)),
    enabled: !!id,
  });

  const handleBackClick = () => {
    window.history.back();
  };

  const handleItemClick = (item: ItemWithDetails) => {
    setLocation(`/item/${item.id}`);
  };

  if (userLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-dark mb-4">User Not Found</h1>
              <p className="text-gray-medium mb-6">The user profile you're looking for doesn't exist.</p>
              <Button onClick={handleBackClick}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = Array.isArray(userItems) ? userItems : userItems.items || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" className="mb-4" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-secondary-black rounded-full flex items-center justify-center">
                {userInfo.avatar ? (
                  <img 
                    src={userInfo.avatar} 
                    alt={userInfo.firstName} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-dark mb-2">
                  {userInfo.firstName} {userInfo.lastName}
                </h1>
                <div className="flex items-center space-x-6 text-gray-medium">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{userInfo.rating}</span>
                    <span>rating</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{userInfo.responseRate}%</span>
                    <span>response rate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{userInfo.responseTime}</span>
                    <span>response time</span>
                  </div>
                </div>
                {userInfo.bio && (
                  <p className="mt-4 text-gray-medium max-w-2xl">{userInfo.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User's Listings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-dark mb-6">
            {userInfo.firstName}'s Listings ({items.length})
          </h2>
          
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onClick={handleItemClick}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-medium">
                  {userInfo.firstName} hasn't listed any items yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}