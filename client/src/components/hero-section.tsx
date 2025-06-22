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
    <section className="gradient-bg text-white py-32 relative overflow-hidden min-h-[110vh] flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/5 rounded-full animate-float"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-64 h-64 bg-white/5 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-20">
        <h2 className="text-5xl md:text-7xl font-bold mb-8 animate-slide-up text-shadow">
          Rent Anything<br />
          <span className="text-gradient bg-gradient-to-r from-white to-blue-200">From Anyone</span>
        </h2>
        <p className="text-xl md:text-2xl mb-12 opacity-90 animate-fade-in max-w-3xl mx-auto" style={{animationDelay: '0.3s'}}>It's that simple.</p>
        
        {/* Category Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto animate-scale-in" style={{animationDelay: '0.6s'}}>
          {featuredCategories.map((category, index) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Home;
            
            return (
              <div
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="glass rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 cursor-pointer hover-lift group"
                style={{animationDelay: `${0.8 + index * 0.1}s`}}
              >
                <IconComponent className="w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                <p className="font-semibold text-lg">{category.name}</p>
              </div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="mt-16 animate-fade-in" style={{animationDelay: '1.2s'}}>
          <div className="inline-flex items-center space-x-2 text-white/80">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Scroll down to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
}
