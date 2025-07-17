import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin } from "lucide-react";

// Use the exact same type as the grid component for compatibility
interface ItemListProps {
  items: any[];
  onItemClick: (item: any) => void;
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
        <div 
          key={item.id} 
          className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
          onClick={() => onItemClick(item)}
        >
          <div className="flex gap-4">
            {/* Image */}
            <div className="flex-shrink-0">
              <img
                src={item.images?.[0] || '/placeholder.jpg'}
                alt={item.title || 'Item'}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <div className="text-xl font-bold text-blue-600">
                  ${item.pricePerDay}/day
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2">
                {item.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{item.city}, {item.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.5</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs border px-2 py-1 rounded">
                  {item.category}
                </span>
                <button 
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}