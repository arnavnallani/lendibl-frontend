import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t-2 border-blue-200 mt-20 w-full relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <img 
              src="/attached_assets/Image_Editor_1750714971523.png" 
              alt="Lendibl" 
              className="h-8 w-auto"
            />
            <span className="text-gray-700 text-sm font-medium">
              © 2025 Lendibl. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href="/privacy-policy" 
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
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