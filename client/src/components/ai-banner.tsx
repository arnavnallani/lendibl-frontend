import { Sparkles } from "lucide-react";

export function AIBanner() {
  return (
    <div className="fixed top-20 left-4 z-50">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm border border-blue-500/20">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}