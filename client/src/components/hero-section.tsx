import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Wrench, Car, Camera, Home, Dribbble, TreePine, Shirt } from "lucide-react";

const categoryIcons = {
  "tools": Wrench,
  "vehicles": Car,
  "electronics": Camera,
  "home-garden": Home,
  "sports": Dribbble,
  "outdoor": TreePine,
  "clothing": Shirt,
};

interface HeroSectionProps {
  onCategorySelect: (categoryId: number) => void;
}

export default function HeroSection({ onCategorySelect }: HeroSectionProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  // Select specific featured categories in the requested order
  const categoryOrder = ['Tools & Equipment', 'Electronics', 'Sports Gear', 'Home & Garden'];
  const featuredCategories = categoryOrder
    .map(name => categories.find(category => category.name === name))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));

  return (
    <section className="relative text-white py-[5rem] overflow-hidden">
      {/* Hero Background Image - lendibl Collage */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('@assets/lendibl_collage_1752546761630.jpg')`
        }}
      />
      
      {/* Enhanced Blue Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/85 to-blue-700/90"></div>
      
      {/* Additional dark blue overlay for enhanced text contrast */}
      <div className="absolute inset-0 bg-blue-900/40"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full animate-float blur-sm"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-64 h-64 bg-white/10 rounded-full animate-float blur-sm" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-white/5 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
        
        {/* Particle effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-6xl md:text-8xl font-bold mb-8 animate-slide-up text-shadow">
          Rent Anything<br />
          <span className="tracking-wider bg-gradient-to-r from-cyan-300 via-gray-100 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl font-light" style={{textShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(56, 189, 248, 0.6), 0 0 90px rgba(255, 255, 255, 0.4)'}}>Anytime</span>
        </h2>
        <p className="text-2xl md:text-3xl mb-12 opacity-95 animate-fade-in max-w-4xl mx-auto font-light leading-relaxed" style={{animationDelay: '0.3s'}}>
          It's that simple.
        </p>
        
        {/* Category Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto animate-scale-in" style={{animationDelay: '0.6s'}}>
          {featuredCategories.map((category, index) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Home;
            
            return (
              <div
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="glass rounded-3xl p-10 transition-all duration-500 cursor-pointer hover-lift group backdrop-blur-xl border-2 border-white/20 hover:border-white/40"
                style={{animationDelay: `${0.8 + index * 0.15}s`}}
              >
                <IconComponent className="w-12 h-12 mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg" />
                <p className="font-bold text-xl group-hover:text-white/90 transition-colors duration-300">{category.name}</p>
              </div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="animate-fade-in" style={{animationDelay: '1.4s', marginTop: '77px'}}>
          <div className="inline-flex items-center space-x-3 text-white/90 group cursor-pointer hover-float">
            <div className="w-3 h-3 bg-gradient-to-r from-white to-blue-200 rounded-full animate-pulse-glow"></div>
            <span className="text-lg font-medium group-hover:text-white transition-colors duration-300">Scroll down to explore</span>
            <div className="w-6 h-6 border-2 border-white/60 rounded-full flex items-center justify-center group-hover:border-white transition-colors duration-300">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
