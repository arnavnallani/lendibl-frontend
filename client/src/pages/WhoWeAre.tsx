import { useState } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Leaf } from "lucide-react";

const FlipCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  isFlipped,
  onFlip 
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  isFlipped: boolean;
  onFlip: () => void;
}) => {
  return (
    <div className="perspective-1000 h-64 w-full max-w-sm mx-auto">
      <div
        className={`relative w-full h-full cursor-pointer preserve-3d transition-transform duration-600 ease-in-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={onFlip}
        style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front of card */}
        <Card className={`absolute inset-0 w-full h-full backface-hidden ${color} border-0 shadow-xl`}>
          <div className="flex flex-col items-center justify-center h-full p-6 text-white">
            <Icon size={48} className="mb-4" />
            <h3 className="text-2xl font-bold text-center">{title}</h3>
            <p className="text-sm opacity-90 mt-2 text-center">Click to learn more</p>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white dark:bg-gray-800 border-0 shadow-xl">
          <div className="flex flex-col items-center justify-center h-full p-6">
            <Icon size={32} className={`mb-4 ${color.includes('blue') ? 'text-blue-500' : color.includes('green') ? 'text-green-500' : 'text-purple-500'}`} />
            <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              {description}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
              Click to flip back
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default function WhoWeAre() {
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  const toggleCard = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const cards = [
    {
      title: "Save Money",
      description: "Instead of having to go to the store and buy something for full price when you only need it for a short amount of time, use our platform to rent anything you need. All for a fraction of the cost.",
      icon: DollarSign,
      color: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    {
      title: "Make Money Effortlessly",
      description: "All you do is list something you own on the app, give it to someone when they request it, get it back in a few days, and the money is yours. Could it get any easier than that?",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-green-500 to-green-700"
    },
    {
      title: "Help the Environment",
      description: "Every time you rent something that other people own instead of actually buying it from somewhere, we lower the demand for mass-production and greatly help the environment. Best side effect ever.",
      icon: Leaf,
      color: "bg-gradient-to-br from-purple-500 to-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Innovative Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-900 rounded-full opacity-30 animate-spin" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-200 dark:bg-green-900 rounded-full opacity-30 animate-pulse" />
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 dark:bg-purple-900 rounded-full opacity-30 animate-bounce" />
        </div>

        {/* Main header content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              WHO WE ARE
            </h1>
          </div>

          <div className="relative animate-fade-in-scale">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-3xl blur-xl opacity-30" />
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 border border-white/50 dark:border-gray-700/50 shadow-2xl">
              <p className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed">
                We are the most innovative way to rent anything from anyone else anytime. 
                You can use our app to...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flip Cards Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
            {cards.map((card, index) => (
              <div
                key={index}
                className="animate-fade-in-up"
                style={{ animationDelay: `${0.8 + index * 0.2}s` }}
              >
                <FlipCard
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  color={card.color}
                  isFlipped={flippedCards[index] || false}
                  onFlip={() => toggleCard(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent dark:from-gray-800 dark:to-transparent pointer-events-none" />
    </div>
  );
}