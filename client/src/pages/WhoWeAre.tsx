import { FlipCard } from '@/components/FlipCard';
import { DollarSign, TrendingUp, Leaf, Sparkles, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhoWeAre() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header Section with Enhanced Animation */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">Discover lendibl</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          >
            Who We Are
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            We allow anyone to rent anything from anyone else anytime. 
            <br />
            <span className="text-blue-600 dark:text-blue-400 font-medium">You can use our app to...</span>
          </motion.p>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <motion.div
              className="text-3xl font-bold text-blue-600 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: "spring" }}
            >
              1000+
            </motion.div>
            <div className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Community Members</span>
            </div>
          </div>
          
          <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <motion.div
              className="text-3xl font-bold text-purple-600 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
            >
              500+
            </motion.div>
            <div className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Items Available</span>
            </div>
          </div>
          
          <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <motion.div
              className="text-3xl font-bold text-green-600 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
            >
              50+
            </motion.div>
            <div className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Cities Served</span>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Flip Cards Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <FlipCard
              frontTitle="Save Money"
              backContent="Instead of having to go to the store and buy something for full price when you only need it for a short amount of time, use our platform to rent anything you need. All for a fraction of the cost."
              icon={<DollarSign size={48} />}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <FlipCard
              frontTitle="Make Money Effortlessly"
              backContent="All you do is list something you own on the app, give it to someone when they request it, get it back in a few days, and the money is yours. Could it get any easier than that?"
              icon={<TrendingUp size={48} />}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <FlipCard
              frontTitle="Help the Environment"
              backContent="Every time you rent something that other people own instead of actually buying it from somewhere, we lower the demand for mass-production and greatly help the environment. Best side effect ever."
              icon={<Leaf size={48} />}
            />
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <motion.div
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-lg font-semibold">Start Your Journey Today</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}