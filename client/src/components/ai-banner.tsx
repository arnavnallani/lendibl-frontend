import { Sparkles } from "lucide-react";

export function AIBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-100 dark:border-blue-800/30">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            Powered by AI
          </span>
          <span className="text-blue-600 dark:text-blue-400 text-xs">
            Smart pricing & recommendations
          </span>
        </div>
      </div>
    </div>
  );
}