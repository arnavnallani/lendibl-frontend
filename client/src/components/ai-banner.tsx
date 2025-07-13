import { Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export function AIBanner() {
  const [location] = useLocation();
  
  // Only show on home page
  if (location !== "/") {
    return null;
  }

  console.log("AIBanner rendering on location:", location);

  return (
    <div className="fixed top-20 sm:top-24 left-2 sm:left-4 z-[9999]">
      <div className="bg-red-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-xl border-4 border-yellow-400">
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}