import { useState } from "react";
import { DollarSign, TrendingUp, Leaf } from "lucide-react";

const FlipCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  iconColor,
  isFlipped,
  onFlip 
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  iconColor: string;
  isFlipped: boolean;
  onFlip: () => void;
}) => {
  return (
    <div className="perspective-1000 h-80 w-full max-w-sm mx-auto">
      <div
        className={`relative w-full h-full cursor-pointer preserve-3d transition-all duration-700 ease-in-out hover:scale-105 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={onFlip}
        style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front of card */}
        <div className={`absolute inset-0 w-full h-full backface-hidden ${color} border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-lg`}>
          <div className="flex flex-col items-center justify-center h-full p-8 text-white">
            <div className="flex flex-col items-center">
              <Icon size={40} className="text-white mb-6" />
              <h3 className="text-2xl font-bold text-center mb-4">{title}</h3>
              <p className="text-sm text-center font-medium">Click to learn more</p>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white dark:bg-black shadow-2xl rounded-lg">
          <div className="flex flex-col items-center justify-center h-full p-8 relative">
            {/* Decorative corner elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-gray-200 dark:border-gray-700 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-gray-200 dark:border-gray-700 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-gray-200 dark:border-gray-700 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-gray-200 dark:border-gray-700 rounded-br-lg" />
            
            <div className="text-center max-w-xs">
              <div className={`${iconColor} bg-gray-50 dark:bg-gray-800 rounded-full p-3 mb-6 mx-auto w-fit`}>
                <Icon size={28} />
              </div>
              <p className="text-black dark:text-white text-center leading-relaxed text-sm font-medium mb-6">
                {description}
              </p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mx-auto mb-4" />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide">
                Click to flip back
              </p>
            </div>
          </div>
        </div>
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
      color: "bg-gradient-to-br from-blue-500 to-blue-700",
      iconColor: "text-blue-500"
    },
    {
      title: "Make Money Effortlessly",
      description: "All you do is list something you own on the app, give it to someone when they request it, get it back in a few days, and the money is yours. Could it get any easier than that?",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-yellow-400 to-yellow-600",
      iconColor: "text-yellow-500"
    },
    {
      title: "Help the Environment",
      description: "Every time you rent something that other people own instead of actually buying it from somewhere, we lower the demand for mass-production and greatly help the environment. Best side effect ever.",
      icon: Leaf,
      color: "bg-gradient-to-br from-green-500 to-green-700",
      iconColor: "text-green-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-black dark:to-gray-900">
      {/* Innovative Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 animate-spin" />
          <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300 dark:bg-blue-700 rounded-full opacity-30 animate-pulse" />
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-400 dark:bg-blue-600 rounded-full opacity-30 animate-bounce" />
        </div>

        {/* Main header content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-blue-800 to-black bg-clip-text text-transparent">
              WHO WE ARE
            </h1>
          </div>

          <div className="relative animate-fade-in-scale">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 rounded-3xl blur-xl opacity-30" />
            <div className="relative bg-white/95 dark:bg-black/95 backdrop-blur-lg rounded-3xl p-10 border-2 border-white/60 dark:border-blue-900/60 shadow-2xl">
              <p className="text-xl md:text-2xl text-black dark:text-white leading-relaxed font-medium">
                We are the most innovative way to rent anything from anyone else anytime. 
                You can use our app to...
              </p>
              {/* Decorative dots */}
              <div className="flex justify-center mt-6 space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
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
                  iconColor={card.iconColor}
                  isFlipped={flippedCards[index] || false}
                  onFlip={() => toggleCard(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent dark:from-black dark:to-transparent pointer-events-none" />
    </div>
  );
}