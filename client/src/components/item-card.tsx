import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemWithDetails } from "@shared/schema";

interface ItemCardProps {
  item: ItemWithDetails;
  onClick: (item: ItemWithDetails) => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : defaultImage;

  return (
    <Card 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-light overflow-hidden cursor-pointer"
      onClick={() => onClick(item)}
    >
      <img 
        src={imageUrl}
        alt={item.title} 
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-medium font-medium">{item.category.name}</span>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-medium ml-1">{item.rating}</span>
          </div>
        </div>
        <h4 className="font-semibold text-gray-dark mb-2">{item.title}</h4>
        <p className="text-sm text-gray-medium mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-dark">${item.price}</span>
            <span className="text-sm text-gray-medium">/day</span>
          </div>
          <div className="flex items-center text-sm text-gray-medium">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{item.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
