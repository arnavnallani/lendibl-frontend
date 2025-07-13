import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FlipCardProps {
  frontTitle: string;
  backContent: string;
  icon: React.ReactNode;
}

export function FlipCard({ frontTitle, backContent, icon }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      className="relative w-full h-72 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="h-full bg-gradient-to-br from-white via-blue-50/50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-gray-400/5 to-blue-400/5"
              animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Floating particles */}
            <motion.div
              className="absolute top-4 right-4"
              animate={isHovered ? { 
                rotate: 360,
                scale: [1, 1.2, 1]
              } : { rotate: 0, scale: 1 }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <Sparkles className="w-4 h-4 text-blue-400/60" />
            </motion.div>

            <motion.div
              className="text-blue-600 dark:text-blue-400 mb-4 relative z-10"
              animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 relative z-10">
              {frontTitle}
            </h3>
            
            <motion.div
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium relative z-10"
              animate={isHovered ? { y: -2 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={isHovered ? { x: 2 } : { x: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Click to discover more
              </motion.div>
              <motion.div
                animate={isHovered ? { x: 4 } : { x: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                →
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="h-full bg-gradient-to-br from-blue-600 via-blue-800 to-black dark:from-blue-700 dark:via-blue-900 dark:to-black rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}
              animate={{
                backgroundPosition: isFlipped ? ['0px 0px', '30px 30px'] : ['0px 0px', '0px 0px']
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isFlipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {frontTitle}
              </h3>
              <p className="text-white/95 leading-relaxed text-base mb-4">
                {backContent}
              </p>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span>Click to flip back</span>
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  ↻
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}