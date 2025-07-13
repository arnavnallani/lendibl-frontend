import { FlipCard } from '@/components/FlipCard';
import { DollarSign, TrendingUp, Leaf } from 'lucide-react';

export default function WhoWeAre() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Who We Are
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            We allow anyone to rent anything from anyone else anytime. You can use our app to...
          </p>
        </div>

        {/* Flip Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FlipCard
            frontTitle="Save Money"
            backContent="Instead of having to go to the store and buy something for full price when you only need it for a short amount of time, use our platform to rent anything you need. All for a fraction of the cost."
            icon={<DollarSign size={48} />}
          />
          
          <FlipCard
            frontTitle="Make Money Effortlessly"
            backContent="All you do is list something you own on the app, give it to someone when they request it, get it back in a few days, and the money is yours. Could it get any easier than that?"
            icon={<TrendingUp size={48} />}
          />
          
          <FlipCard
            frontTitle="Help the Environment"
            backContent="Every time you rent something that other people own instead of actually buying it from somewhere, we lower the demand for mass-production and greatly help the environment. Best side effect ever."
            icon={<Leaf size={48} />}
          />
        </div>


      </div>
    </div>
  );
}