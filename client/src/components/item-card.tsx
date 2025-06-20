import { Star, MapPin, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { ItemWithDetails } from "@shared/schema";

interface ItemCardProps {
  item: ItemWithDetails;
  onClick: (item: ItemWithDetails) => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const { user } = useAuth();
  const isOwner = user && item.ownerId === user.id;
  
  // Clean up debug logging
  const defaultImage = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;

  return (
    <Card 
      className="bg-white rounded-2xl shadow-sm border border-gray-light overflow-hidden cursor-pointer card-hover group animate-fade-in"
      onClick={() => onClick(item)}
    >
      <div className="relative overflow-hidden">
        <img 
          src={imageUrl}
          alt={item.title} 
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs font-semibold text-gray-dark">{item.rating}</span>
          </div>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-primary-blue text-white text-xs px-3 py-1 rounded-full font-medium">
            {item.category.name}
          </span>
          {isOwner && (
            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Your Item
            </span>
          )}
        </div>
      </div>
      
      <CardContent className="p-5">
        <h4 className="font-bold text-gray-dark mb-2 text-lg group-hover:text-primary-blue transition-colors">
          {item.title}
        </h4>
        <p className="text-sm text-gray-medium mb-4 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-dark">${item.price}</span>
            <span className="text-sm text-gray-medium ml-1">/day</span>
          </div>
          <div className="flex items-center text-sm text-gray-medium bg-gray-light/50 px-3 py-1 rounded-full">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="font-medium">{item.location}</span>
          </div>
        </div>

        {/* Availability indicator */}
        <div className="flex items-center mt-3 pt-3 border-t border-gray-light/50">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-xs text-gray-medium font-medium">Available now</span>
        </div>
      </CardContent>
    </Card>
  );
}
