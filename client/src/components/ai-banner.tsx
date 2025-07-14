import { Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export function AIBanner() {
  const [location] = useLocation();
  
  // Only show on home page
  if (location !== "/") {
    return null;
  }

  return (
    <div className="fixed top-28 sm:top-32 lg:top-20 left-2 sm:left-4 z-50">
      <div className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm border border-blue-500/20">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}