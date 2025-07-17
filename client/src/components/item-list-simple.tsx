import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Calendar } from "lucide-react";
import type { Item, User } from "@shared/schema";

interface ItemWithOwner extends Item {
  owner: Pick<User, 'id' | 'username' | 'rating' | 'responseRate' | 'responseTime'>;
}

interface ItemListProps {
  items: ItemWithOwner[];
  onItemClick: (item: ItemWithOwner) => void;
}

export default function ItemList({ items, onItemClick }: ItemListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onItemClick(item)}
        >
          <div className="flex gap-4">
            {/* Image */}
            <div className="flex-shrink-0">
              <img
                src={item.images?.[0] || '/placeholder.jpg'}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    ${item.pricePerDay}/day
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{item.city}, {item.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{item.owner.rating?.toFixed(1) || 'New'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
                <Button 
                  size="sm" 
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}