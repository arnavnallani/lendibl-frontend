import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Wrench, Car, Camera, Home } from "lucide-react";

const categoryIcons = {
  "tools": Wrench,
  "vehicles": Car,
  "electronics": Camera,
  "home-garden": Home,
};

interface HeroSectionProps {
  onCategorySelect: (categoryId: number) => void;
}

export default function HeroSection({ onCategorySelect }: HeroSectionProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  const featuredCategories = categories.slice(0, 4);

  return (
    <section className="bg-gradient-to-r from-primary-blue to-blue-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Rent Anything<br />From Anyone
        </h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Tools, vehicles, equipment, and more. Available in your neighborhood.
        </p>
        
        {/* Category Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {featuredCategories.map((category) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Home;
            
            return (
              <div
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <IconComponent className="w-8 h-8 mx-auto mb-3" />
                <p className="font-medium">{category.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
