import { useState } from 'react';
import { motion } from 'framer-motion';

interface FlipCardProps {
  frontTitle: string;
  backContent: string;
  icon: React.ReactNode;
}

export function FlipCard({ frontTitle, backContent, icon }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="h-full bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {frontTitle}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click to learn more
            </p>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="h-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              {frontTitle}
            </h3>
            <p className="text-white/90 leading-relaxed">
              {backContent}
            </p>
            <p className="text-white/70 text-sm mt-4">
              Click to flip back
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}