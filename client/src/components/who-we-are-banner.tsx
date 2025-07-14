import { useLocation, Link } from "wouter";

export function WhoWeAreBanner() {
  const [location] = useLocation();
  
  // Only show on home page
  if (location !== "/") {
    return null;
  }

  return (
    <div className="fixed top-32 sm:top-36 md:top-28 lg:top-20 right-2 sm:right-4 z-50">
      <Link href="/who-we-are">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm border border-yellow-500/20">
          <div className="flex items-center text-xs sm:text-sm font-semibold">
            <span style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>Why lendibl?</span>
          </div>
        </div>
      </Link>
    </div>
  );
}