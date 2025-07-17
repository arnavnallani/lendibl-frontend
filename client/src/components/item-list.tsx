import React from "react";
import { MapPin, Star, Calendar, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemWithDetails } from "@shared/schema";

interface ItemListProps {
  items: ItemWithDetails[];
  onItemClick: (item: ItemWithDetails) => void;
}

export default function ItemList({ items, onItemClick }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-medium text-lg mb-4">No items found</p>
        <p className="text-gray-medium">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 border-gray-light hover:border-gray-medium"
          onClick={() => onItemClick(item)}
        >
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Image Section */}
              <div className="sm:w-64 h-48 sm:h-40 bg-gray-100 overflow-hidden rounded-l-lg">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  {/* Left Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-dark mb-1 hover:text-primary-blue transition-colors">
                          {item.title}
                        </h3>
                        <Badge variant="secondary" className="bg-blue-50 text-primary-blue border-blue-200">
                          {item.category?.name || "Uncategorized"}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-medium text-sm mb-3 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {item.description}
                    </p>

                    {/* Item Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-medium mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{item.city}, {item.state}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>by {item.owner?.username || "Unknown"}</span>
                      </div>

                      {item.owner?.rating && item.owner.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{item.owner.rating.toFixed(1)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{item.owner?.totalListings || 0} listings</span>
                      </div>
                    </div>

                    {/* Availability */}
                    {item.availableFrom && item.availableTo && (
                      <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Available {new Date(item.availableFrom).toLocaleDateString()} - {new Date(item.availableTo).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Content - Price and Action */}
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-dark mb-1">
                        ${parseFloat(item.price).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-medium">per day</div>
                    </div>
                    
                    <Button 
                      variant="default"
                      size="sm"
                      className="bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 whitespace-nowrap"
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}