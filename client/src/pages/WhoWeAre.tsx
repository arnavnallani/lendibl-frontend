import { FlipCard } from '@/components/FlipCard';
import { AIAgentCard } from '@/components/AIAgentCard';
import { DollarSign, TrendingUp, Leaf, Sparkles, Search, MessageCircle, Shield, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';


export default function WhoWeAre() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
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
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/10 dark:bg-blue-400/10 rounded-full blur-3xl"
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"
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
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          >
            Our Mission
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

        {/* Simple Scroll Arrow */}
        <div className="flex justify-center mt-16 mb-16">
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>

        {/* The lendibl difference Section */}
        <motion.div 
          className="mt-32 mb-20 mx-auto max-w-full bg-gradient-to-b from-blue-100 via-blue-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-black py-20 px-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <div className="text-center max-w-6xl mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 tracking-wider"
              style={{ 
                fontFamily: 'Courier New, monospace',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.1em'
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.8 }}
            >
              The lendibl difference
            </motion.h2>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.8 }}
            >
              We're not like any other rental company. At lendibl we focus on one main thing:
            </motion.p>

            <motion.div
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent mb-16"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 1.2, ease: "easeOut" }}
            >
              simplicity
            </motion.div>

            <motion.p 
              className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.8 }}
            >
              We pay attention to every single minute step of the rental process to make sure everything is both intuitive and seamless. To do this, we realized that we needed to be powered by AI. We have 5 powerful agents that help you throughout all of this...
            </motion.p>

            {/* AI Agents Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.8 }}
            >
              <AIAgentCard
                title="Recommendations"
                frontIcon={<Sparkles className="w-8 h-8 text-white" />}
                backContent="Here, machine learning algorithms use your activity on the site to smartly detect what items you'll likely be interested in next. Instead of having to manually look through items to find what you need, we intelligently hand pick what we predict you need."
                cardColor="bg-red-500"
              />
              <AIAgentCard
                title="Search"
                frontIcon={<Search className="w-8 h-8 text-white" />}
                backContent="AI analyzes your search input to truly understand what you're saying before delivering the item outputs. All within 2-3 seconds. Instead of a search bar that can only detect keywords, or doesn't get what you're actually saying, our AI comprehends the full scope of what you type to show you items like a real person."
                cardColor="bg-blue-500"
              />
              <AIAgentCard
                title="Pricing"
                frontIcon={<DollarSign className="w-8 h-8 text-white" />}
                backContent="Using market data, demand patterns, and seasonal trends, this AI agent gives you intelligent pricing suggestions after reviewing all of your listing information. Unlike other platforms that manually suggest to you how to price your item, our AI uses all the data available to intelligently give you a recommendation."
                cardColor="bg-green-500"
              />
              <AIAgentCard
                title="Chat"
                frontIcon={<MessageCircle className="w-8 h-8 text-white" />}
                backContent="A generative AI model that accurately gives you any information at all about how to use the lendibl app. Unlike other chat systems that only understand certain phrases in a rigid way, our chatbot can be communicated with just like a regular person, except it's someone who knows everything there is to know about lendibl."
                cardColor="bg-orange-500"
              />
              <AIAgentCard
                title="Authentication"
                frontIcon={<Shield className="w-8 h-8 text-white" />}
                backContent="After you put in your registration info, AI analyzes your email and phone number to make sure that they pass verification checks, including fraud detection. Instead of having to go through that whole annoying process of getting a code sent to you and and putting that in, we verify you without you having to do anything."
                cardColor="bg-purple-500"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 0.8 }}
        >
          <motion.div
            className="inline-block bg-gradient-to-r from-blue-600 to-black text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:scale-105"
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