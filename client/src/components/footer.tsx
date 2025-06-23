import { Link } from "wouter";

export default function Footer() {
  console.log("Footer component rendered");
  return (
    <footer className="bg-blue-50 border-t-4 border-blue-500 mt-20 w-full relative z-10 min-h-[200px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <img 
              src="/attached_assets/Image_Editor_1750714971523.png" 
              alt="Lendibl" 
              className="h-8 w-auto"
            />
            <span className="text-blue-900 text-base font-bold">
              © 2025 Lendibl. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/privacy-policy" 
              className="text-blue-900 hover:text-blue-600 text-base font-bold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-blue-900 hover:text-blue-600 text-base font-bold transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="text-blue-900 hover:text-blue-600 text-base font-bold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-gray-600 text-xs text-center">
            Lendibl is a peer-to-peer rental marketplace. Payment processing provided by Stripe.
          </p>
        </div>
      </div>
    </footer>
  );
}