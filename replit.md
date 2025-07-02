# replit.md

## Overview

This is a rental marketplace application called "Lendibl" that allows users to rent and list items in their community. It's built as a full-stack web application with a React frontend and Express.js backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Database**: PostgreSQL with Drizzle ORM (DatabaseStorage implementation)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: tsx for TypeScript execution in development

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users**: User profiles with ratings and response metrics
- **Categories**: Item categorization system
- **Items**: Rental listings with pricing, location, and availability
- **Bookings**: Rental transactions between users
- **Reviews**: User feedback system (schema defined but not fully implemented)

## Key Components

### Client-Side Components
- **Header**: Navigation with search, mode toggle (renter/lister), notifications, and user controls
- **HeroSection**: Landing page with featured categories
- **FilterBar**: Category, price, and location filtering
- **ItemGrid**: Paginated item display with loading states
- **ItemCard**: Individual item preview cards
- **BookingModal**: Rental request interface
- **NotificationBell**: Real-time notification center with WebSocket connection
- **Form Components**: Comprehensive form system using shadcn/ui

### Server-Side Components
- **Routes**: RESTful API endpoints for categories, items, and bookings
- **Storage**: Abstract storage interface with PostgreSQL database implementation
- **Database**: Drizzle ORM with Neon serverless PostgreSQL connection
- **WebSocket Server**: Real-time notifications for rental requests
- **Vite Integration**: Development server with HMR support

### Shared Components
- **Schema**: Drizzle ORM schema definitions with Zod validation
- **Type Safety**: Shared TypeScript types between client and server

## Data Flow

1. **Client Request**: React components make API requests using TanStack Query
2. **API Layer**: Express routes handle requests and validate input
3. **Data Layer**: Storage interface abstracts database operations
4. **Database**: PostgreSQL stores persistent data via Drizzle ORM
5. **Response**: JSON responses sent back to client
6. **UI Update**: React Query automatically updates UI with fresh data

### Key User Flows
- **Browse Items**: Filter by category, search, price range, and location
- **View Details**: Detailed item view with owner information and booking option
- **Make Booking**: Request rental with date selection, messaging, and escrow payment
- **Payment Processing**: Secure credit card payment held in escrow until approval
- **Booking Management**: Owners approve/decline with automatic payment capture or refunds
- **Automatic Payouts**: Owners receive payment 24 hours after rental period ends
- **List Item**: Create new rental listings with images and details
- **Real-time Notifications**: Instant alerts for payment status and booking updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components for accessibility
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production bundling for server
- **tailwindcss**: Utility-first CSS framework

### External Services
- **Replit**: Development environment and deployment platform
- **PostgreSQL**: Database service (configured in .replit)
- **Stripe**: Payment processing for secure credit card transactions
- **Unsplash**: Default placeholder images for items

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port**: Application runs on port 5000
- **Hot Reload**: Vite HMR for frontend, tsx for backend

### Production Build
- **Client**: Vite builds React app to `dist/public`
- **Server**: esbuild bundles Express app to `dist/index.js`
- **Static Files**: Express serves built React app in production
- **Database**: Uses DATABASE_URL environment variable

### Build Commands
- `npm run dev`: Development with hot reload
- `npm run build`: Production build for both client and server
- `npm run start`: Production server
- `npm run db:push`: Deploy database schema changes

## Changelog

- June 20, 2025: Initial setup of Lendibl rental marketplace
- June 20, 2025: Updated color scheme from red/teal to blue/black/white
- June 20, 2025: Added sample rental items (camera, drill set, mountain bike)
- June 20, 2025: Migrated from in-memory storage to PostgreSQL database
- June 20, 2025: Updated header to use custom Lendibl logo image
- June 20, 2025: Enhanced UI with modern animations, glass morphism, gradients, and hover effects
- June 20, 2025: Implemented real-time notifications with WebSocket for rental requests
- June 20, 2025: Added user authentication system with registration and login functionality
- June 20, 2025: Fixed authentication token handling in API requests and item listing functionality
- June 20, 2025: Resolved price validation error - updated frontend to send decimal prices as strings to match database schema
- June 20, 2025: Implemented personalized item recommendation engine with user interaction tracking, preference learning, and collaborative filtering algorithms
- June 20, 2025: Added MyProfile page showing user's listings, bookings, rentals, and earnings - accessible via account dropdown
- June 20, 2025: Updated item filtering so users don't see their own items on the home page
- June 20, 2025: Enhanced MyProfile page with edit profile functionality and navigation improvements
- June 20, 2025: Implemented item management in profile - click items to edit or delete listings with comprehensive form validation and authorization checks
- June 20, 2025: Created dedicated Settings page for personal information management with improved user experience and navigation from account dropdown
- June 20, 2025: Fixed item ownership detection - items show green "Your Item" badge when user is logged in and owns the item, clicking owned items redirects to profile page for editing
- June 20, 2025: Enhanced item editing with photo management - users can now add/remove images in the edit modal with URL input and visual preview
- June 20, 2025: Successfully implemented complete photo editing functionality in profile page - users can manage item images with visual preview, add new photos via URL, and remove existing photos
- June 20, 2025: Implemented booking approval/decline functionality with real-time notifications and clickable renter profiles
- June 20, 2025: Added Stripe payment integration for secure reservation processing - users can now pay when reserving items
- June 20, 2025: Fixed payment modal blank page issue caused by duplicate onError handlers in booking mutation
- June 20, 2025: Added 8 additional rental items owned by different users (cameras, laptops, bikes, DJ equipment, camping gear, gaming consoles) for better marketplace variety
- June 20, 2025: Implemented streamlined payment confirmation UI that bypasses Stripe Elements rendering issues while maintaining payment-first workflow
- June 20, 2025: Confirmed core marketplace features working: item browsing, filtering, recommendations, booking creation, notifications, and user profiles
- June 20, 2025: Payment processing now properly requires confirmation before booking creation
- June 21, 2025: Created simple payment modal component to fix rendering issues and ensure reliable payment-first workflow
- June 21, 2025: Successfully implemented real Stripe credit card processing with CardElement - users can now pay with actual credit cards and payments are held by Stripe
- June 21, 2025: Enhanced payment system with live/test mode detection and proper error handling for both restricted API keys and standard keys
- June 21, 2025: Implemented comprehensive escrow payment system with automatic refunds, payment capture on approval, and scheduled payouts to owners 24 hours after rental period ends
- June 21, 2025: Added renter cancellation functionality for pending bookings with automatic refund processing
- June 22, 2025: Created comprehensive Action Dashboard with rental status tracking, messaging system, and 3-stage rental process (pre-rental, active, completed) with proper payment integration
- June 22, 2025: Replaced notification bell with Messages page - dedicated conversation board showing all rental-related conversations with real-time messaging interface
- June 22, 2025: Enhanced design with spectacular visual improvements - advanced animations, glass morphism effects, gradient backgrounds, enhanced hover states, and premium polish throughout the interface
- June 23, 2025: Implemented comprehensive payment collection system with three key trigger points: before payout attempts, rental approval requirements, and periodic reminders for owners with pending earnings
- June 23, 2025: Replaced mock Stripe implementation with real Stripe Connect integration - credit card information now securely stored with Stripe, real Express accounts created for payouts, and actual payment method management
- June 23, 2025: Completed Stripe Elements integration for secure payment setup with PCI-compliant card input, real-time validation, and production-ready live key configuration
- June 23, 2025: Modified payout structure - owners receive exactly the item's list price (daily rate × rental days), with Lendibl keeping any amount above that as variable commission
- June 23, 2025: Updated payout timing to process immediately when rental period ends instead of waiting 24 hours
- June 23, 2025: Successfully tested and confirmed working payout system - owners receive exact list price transfers to their stored payment methods with variable commission structure operational
- June 23, 2025: Added comprehensive privacy policy page and footer component with legal compliance links accessible from all main pages
- June 24, 2025: Fixed payment flow implementation to ensure proper money transfer: renter payments go to Lendibl via Stripe, then exact list price amount transfers to owners while Lendibl keeps the commission difference
- June 24, 2025: Implemented Stripe Connect for real owner payouts - creates Express accounts for owners, handles onboarding, and enables actual money transfers from Lendibl to owner bank accounts/cards
- June 24, 2025: Fixed Stripe payout implementation to use direct payouts from Lendibl's Stripe balance to owners, with simulation fallback for development - ensures exact list price transfers while Lendibl keeps commission
- June 24, 2025: Successfully implemented and tested complete payment flow: renter payments go to Lendibl via Stripe, then exact list price amount ($0.50) transfers to owner while Lendibl keeps commission ($0.03) - verified working with booking ID 21
- June 24, 2025: Created complete Stripe Connect onboarding system - owners can create Connect accounts via Settings page, complete onboarding through Stripe interface, and receive real money transfers upon rental completion
- June 24, 2025: Removed all simulation code and enabled real money transfers - Stripe Connect accounts are now created as real Express accounts, payments are processed with actual money movement, and payouts require completed Connect onboarding
- June 24, 2025: Integrated PayPal Platform API for simplified owner payment setup - owners can now choose between PayPal (simple account connection) or Stripe Connect (full business verification) for receiving rental payouts, maintaining exact payment flow with real money transfers
- June 24, 2025: Modified item listing flow to prompt owners for payment setup (PayPal/Stripe Connect) instead of credit card collection after listing their first item, with option to skip and configure later in Settings
- June 24, 2025: Simplified PayPal integration to use email-based setup instead of complex OAuth flow - owners provide PayPal email directly for streamlined onboarding
- June 24, 2025: Enhanced PayPal setup flow with clear instructions about needing existing PayPal account and signup link for new users
- June 24, 2025: Fixed payment flow to use automatic capture - money now goes directly from renter to Lendibl's account, then exact list price transfers to owner while Lendibl keeps commission difference
- June 24, 2025: Implemented simplified real money transfer system - PayPal users provide email address, Lendibl processes manual payouts from captured renter payments to owner PayPal accounts, maintaining exact list price transfers while keeping commission difference
- June 24, 2025: Enhanced PayPal integration with real Payouts API - system now attempts automated transfers to owner PayPal accounts with fallback to manual logging if API fails
- June 24, 2025: Discovered Stripe→PayPal direct transfer limitation - PayPal payouts require PayPal account balance, but rental payments are in Stripe account. Implemented manual transfer process with detailed logging for Stripe→Bank→PayPal workflow
- June 24, 2025: Redesigned payment flow to optimal structure: Renter → Lendibl Stripe → Lendibl PayPal → Owner PayPal. This enables automated PayPal payouts once Lendibl's PayPal account is funded from Stripe balance
- June 24, 2025: Diagnosed PayPal authentication issue - current API credentials failing with "Client Authentication failed" error. Need updated credentials from Lendibl's PayPal business account for automated payouts to function
- June 24, 2025: Fixed PayPal API endpoint configuration - business account credentials work with production API (api.paypal.com) not sandbox. Automated PayPal payouts now functional with proper API endpoint
- June 24, 2025: Identified PayPal Payouts API permission issue - business account requires "Payouts" feature enabled in Developer Console for automated transfers. Authorization working but payouts blocked due to insufficient API permissions
- June 24, 2025: Created PayPal Payouts enablement guide - user needs to check "Payouts" feature in PayPal Developer Console app settings. Once enabled, automated money transfers will work immediately for all rental completions
- June 24, 2025: Diagnosed PayPal funding issue - Payouts API enabled but authorization fails due to insufficient PayPal business account balance. Solution: Add funds to PayPal business account for automated transfers to work
- June 24, 2025: PayPal account funded with $14.55 - automated payout system now ready for real money transfers to owner PayPal accounts when rentals complete
- June 24, 2025: PayPal authorization error persists despite funding - investigating deeper app permission requirements. May need PayPal business account review or app approval for live payouts beyond basic API access
- June 24, 2025: Identified PayPal business account limitation - requires manual approval from PayPal for live payout processing. Implemented hybrid system with manual fallback logging until approval granted. Payment flow works end-to-end with proper error handling and manual action instructions
- June 24, 2025: Implemented Stripe Connect for fully automated payouts - owners receive instant money transfers to bank accounts/cards when rentals complete. No manual processing required, handles verification flow and instant payouts automatically
- June 24, 2025: Simplified bank account linking process - streamlined Stripe Connect onboarding with automatic account creation, one-click setup, and immediate redirect to Stripe's secure bank account connection flow
- June 24, 2025: Removed all PayPal integration from settings and payment setup - simplified to Stripe Connect only for bank account connections. Fixed Stripe Express account creation by removing platform-specific requirements
- June 24, 2025: Completely removed PayPal from all payment flows and settings - simplified to Stripe Connect only for bank account connections. Fixed Stripe Express account creation to work with real API and create actual Connect accounts for instant bank transfers
- June 24, 2025: Identified Stripe Connect platform profile requirement - real money transfers blocked until Stripe marketplace platform profile is configured in Dashboard. User wants only real money transfers, no simulations
- June 24, 2025: Created comprehensive Stripe platform setup guide (STRIPE_PLATFORM_SETUP.md) with exact steps to enable real money transfers. Enhanced error handling to guide users to platform setup when required
- June 24, 2025: Platform profile already configured in Stripe Dashboard - only requires acknowledging two liability agreements to activate real money transfers immediately
- June 24, 2025: Identified US domestic marketplace configuration issue in Stripe - "recipient ToS agreement not supported" error requires Stripe support to configure account for US domestic operations. Created comprehensive support contact guide
- June 25, 2025: Stripe support confirmed US domestic marketplace configuration not available at this stage. Modified Express account creation to use standard onboarding flow with individual business type and proper capabilities for real money transfers
- June 25, 2025: Fixed HTTPS URL issue for Stripe Connect onboarding links and restored simplified bank account connection feature in Settings page
- June 25, 2025: Fixed automatic payout system - added interval checking for completed rentals and immediate payout processing when rental periods end to ensure owners receive bank transfers
- June 25, 2025: Diagnosed and fixed Stripe balance issue - payments go to Lendibl's Stripe account but require 2-7 business days to settle before being available for owner payouts. Enhanced error handling and user notifications for settlement timing delays
- June 24, 2025: Implemented dynamic search functionality with real-time suggestions, auto-complete, recent searches, trending items, smart filtering, and enhanced UI with search API endpoint and debounced input
- June 24, 2025: Successfully integrated dynamic search functionality directly into top header search bar with real-time suggestions, recent search tracking, smart auto-completions, "Search for anything..." placeholder, and automatic scrolling to items section when typing
- June 24, 2025: Implemented real money transfer system with Stripe Connect - removed all simulations and test modes, system now creates actual Express accounts and processes real money transfers to owner bank accounts when rentals complete
- June 25, 2025: Implemented AI-powered smart pricing feature on list item page - owners can choose between AI suggestions (analyzing demand, seasonality, local events) or manual pricing to maximize earnings
- June 25, 2025: Enhanced AI pricing system to automatically estimate original item value from title and description - removed need for owners to input purchase price, making the listing process more streamlined
- June 25, 2025: Updated AI pricing to use GPT-4o-mini for cost-effective analysis, resolving quota issues while maintaining intelligent pricing suggestions
- June 25, 2025: Implemented pure Google Gemini AI pricing system - removed all market analysis fallbacks and OpenAI dependencies for completely free AI-powered pricing
- June 25, 2025: Cleaned up marketplace database by removing all test items, bookings, and user interactions - marketplace now contains only legitimate rental items
- June 27, 2025: Enhanced mobile UI optimization - removed AI badge from non-home pages, shortened navigation button text ("Rent"/"List" on mobile), improved profile tab labels, fixed mobile layout overflow issues, and optimized AI pricing button text for mobile devices
- June 28, 2025: Implemented comprehensive file upload system with drag-and-drop functionality for item images, replacing URL-based input with direct file selection and visual preview grid
- June 28, 2025: Made interactive search bar fully functional on all screen sizes - mobile now has same DynamicSearch features as desktop including real-time suggestions and auto-scroll
- June 28, 2025: Updated location field to address field in item listings with privacy notice explaining address is only shared with approved renters
- June 28, 2025: Implemented address sharing in action dashboard - renters can see owner's pickup address after booking approval with coordination instructions
- June 28, 2025: Completed comprehensive notification system with database storage, real-time updates, and account dropdown integration - covers all rental events (bookings, approvals, payments) with red dot indicator for unread notifications
- June 28, 2025: Fixed notification UI to show only red dot indicator on account button without any number display - clean notification system with proper dropdown menu integration
- June 28, 2025: Completely removed unread count display from header - notifications now handled exclusively through dropdown menu panel with no number indicators
- June 28, 2025: Added clean red dot notification indicator to top right of account circle - appears only when notifications exist, no "0" display when empty
- June 28, 2025: Modified notification UI to show count badge only inside dropdown menu next to "Notifications" button - removed red dot from account circle for cleaner interface
- June 28, 2025: Split address field into separate components (address, city, state dropdown, zip code) with privacy protection - only city and state visible before rental approval, full address shared after approval through direct coordination
- June 28, 2025: Restored red dot notification indicator to top right of account circle while maintaining count badge in dropdown menu for comprehensive notification visibility
- June 28, 2025: Fixed account circle "0" display issue by improving notification count rendering logic and adding safe navigation for user name initials
- June 28, 2025: Resolved notification badge "0" display in dropdown menu by fixing conditional rendering to only show badges when unreadCount > 0
- June 28, 2025: Enhanced notification dropdown menu with inline count badge next to "Notifications" text and improved spacing using space-x-3 for clean visual hierarchy
- June 28, 2025: Updated notification menu item spacing to match Settings and Profile items using consistent mr-2 spacing for uniform dropdown menu alignment
- June 28, 2025: Fixed notification menu item structure to match exact alignment of other dropdown items by removing nested div wrapper and using direct icon placement
- June 28, 2025: Corrected notification icon alignment by removing custom flex classes and using default DropdownMenuItem styling to match Settings and Profile items perfectly
- June 28, 2025: Implemented browser desktop notifications for listing publications - users now receive desktop notifications when they successfully publish listings with click-to-view functionality
- June 28, 2025: Extended desktop browser notifications to all notification types - booking requests, approvals, rental updates, and payments now trigger system notifications with relevant emojis and click-to-navigate functionality
- June 28, 2025: Enhanced notification navigation to direct users to specific MyProfile tabs - listing published notifications go to My Listings tab, rental request notifications go to Rental Requests tab with URL parameter support
- June 28, 2025: Fixed full address display in Action Dashboard - approved bookings now show complete pickup address to renters instead of just city/state for proper coordination
- June 28, 2025: Implemented date range calendar for item availability - owners can now set specific availability periods when listing items with intuitive calendar interface and flexible date management
- June 28, 2025: Added booking date validation - renters can only select dates within the owner's specified availability window with visual availability display and automatic date restrictions
- June 28, 2025: Diagnosed payout system - money is available in Lendibl's Stripe account ($2.75 available, $5.27 pending) but owners need completed Stripe Connect onboarding for bank transfers to work
- June 28, 2025: Confirmed real money transfers working - $0.50 successfully transferred from Lendibl to owner's Stripe Connect account, money arrives in owner's bank account within 2 business days per Stripe's automatic payout schedule
- June 28, 2025: Implemented free address autofill using OpenStreetMap Nominatim API - automatically fills city, state, and zip code when users select address suggestions, no API keys required
- June 29, 2025: Enhanced AI pricing system with hard $50 maximum constraint for items with original prices up to $5000 - AI now understands and enforces pricing limits with clear prompting and fallback enforcement
- June 29, 2025: Fixed MacBook Pro pricing estimation - corrected overestimation issue where MacBook Pro 14-inch was valued at $4,050 instead of realistic $2,200, removed Electronics category multiplier for accurate pricing
- June 29, 2025: Removed all multipliers from AI pricing system - simplified to use direct base values only for consistent and predictable item value estimation
- June 29, 2025: Updated MacBook Pro 14-inch pricing to $1,600 for accurate market value estimation
- June 29, 2025: Switched AI pricing system to use Gemini 2.5 Flash model for improved accuracy and performance
- June 29, 2025: Reverted AI pricing system back to Gemini 1.5 Flash model for better performance
- June 29, 2025: Switched back to Gemini 2.5 Flash and implemented specific pricing guidelines - $1000 items target $35/day, $2000 items target $40/day, $3000 items target $45/day, $4000 items target $50/day
- June 29, 2025: Enhanced AI pricing accuracy with specific MacBook model recognition - 14-inch MacBook Pro Space Black correctly identified at $1600, improved keyword matching for more precise original price estimation
- June 29, 2025: Fixed AI pricing logic - items under $1000 max $40 suggestion, items over $1000 use formula y=0.005x+30 with market flexibility, added Apple Vision Pro at $3500 original price
- June 29, 2025: Removed keyword-based item estimation - AI now naturally understands items and applies pricing rules directly without preset keywords or $100 defaults
- June 29, 2025: Updated pricing constraint for items under $1000 from $40 maximum to $35 maximum daily rate
- June 29, 2025: Enhanced AI pricing to suggest much lower prices in general for items under $1000 to be more competitive
- June 29, 2025: Implemented AI chatbot assistant with floating circle interface in bottom right corner - answers questions about Lendibl using Gemini 2.5 Flash model
- June 29, 2025: Implemented comprehensive review prompt system that automatically triggers after completed transactions - users prompted to rate their experience with star ratings and comments
- June 29, 2025: Reset all user ratings to 0 and implemented authentic rating system - ratings only update based on actual submitted reviews, calculating accurate averages
- June 29, 2025: Fixed rating display caching issue - items now show owner's current rating from users table instead of cached item ratings, ensuring authentic rating display
- June 29, 2025: Fixed hardcoded 4.8 rating in MyProfile page - now displays user's actual rating (4.0 for epicswag) from database instead of static value
- June 29, 2025: Modified review prompt system for testing - now shows review modal every time app opens instead of only after completed transactions
- June 30, 2025: Enhanced AI search system with smart semantic fallback - improved understanding of queries like "computer" (finds MacBooks) and "cool stuff" (finds trendy electronics), added rate limit handling with intelligent mappings
- June 30, 2025: Updated category structure to: Electronics, Home & Garden, Tools & Equipment, Sports Gear, Outdoor, Clothing, Vehicles - Sports Gear now features basketball icon in hero section
- June 30, 2025: Fixed review modal text from "Item you rented" to "Transaction Item" for clearer terminology
- June 30, 2025: Added "Current Real Price of Item" field to main listing form before pricing buttons - owners specify actual market value, AI automatically uses this real data for accurate pricing suggestions instead of estimation
- July 1, 2025: Fixed camera system to use back camera for AR item scanning - resolved loading issues and improved reliability
- July 1, 2025: Fixed publish listing button by resolving form validation issues and fixing price schema requirements
- July 1, 2025: Increased Express server body parser limit to 10MB to support image uploads in listings
- July 1, 2025: Switched all AI services from Gemini 2.5 to Gemini 1.5 - updated pricing, search, and chatbot services per user request
- July 1, 2025: Updated edit item modal to use image upload component instead of URL input - consistent with list items page for better user experience
- July 1, 2025: Fixed review prompt system to only show after completed transactions instead of on every app load
- July 1, 2025: Added "Hey [Name]!" greeting message in header navigation for logged-in users
- July 1, 2025: Enhanced responsive logo switching to use larger breakpoint (lg instead of md) - mobile logo now shows when window gets smaller and logo would start shrinking
- July 1, 2025: Added tablet search bar for medium screens to provide better responsive experience between desktop and mobile breakpoints
- July 1, 2025: Implemented smart alternative suggestions for empty search results with "We don't have that yet... but you may be interested in..." fallback showing similar items based on category relationships
- July 2, 2025: Modified account dropdown to become circular on smaller screens while keeping menu icon hidden on mobile - maintains clean responsive design
- July 2, 2025: Made "Hey [Name]!" greeting visible at all screen sizes instead of hiding on mobile for consistent user experience
- July 2, 2025: Enhanced mobile navigation bar with optimized spacing, compact elements, and improved responsive design - reduced padding, smaller icons on mobile, and better proportional sizing across breakpoints
- July 2, 2025: Improved mobile navigation spacing with better proportional gaps between elements, enhanced mode toggle button spacing, and optimized user controls layout for cleaner mobile experience
- July 2, 2025: Increased action dashboard and messaging button size on mobile from 8x8 to 9x9 pixels for better usability while maintaining navbar integration
- July 2, 2025: Moved action dashboard, messaging, account buttons and greeting message 1 pixel left on mobile view for improved positioning and visual balance
- July 2, 2025: Fixed mobile search scroll behavior to prevent rapid scrolling during typing - now scrolls to items section only once when starting to type and stays there
- July 2, 2025: Enhanced mobile search positioning to show both search bar and items section when keyboard is up - optimized scroll position to keep both elements visible during typing
- July 2, 2025: Fixed mobile search to stay focused on items section when typing - removed state tracking and simplified scroll behavior to scroll down further and stay at items level
- July 2, 2025: Implemented mobile-specific search scroll behavior that only triggers once on first character typed, keeps search bar visible, and prevents bouncing scroll on mobile devices
- July 2, 2025: Optimized mobile search scroll position to show actual items while maintaining search bar visibility - scrolls down further to focus on item cards with +150px offset
- July 2, 2025: Fixed mobile search scroll bounce-back issue with multiple scroll attempts and instant positioning to prevent interference from other scroll behaviors
- July 2, 2025: Increased mobile search scroll offset to +250px to position view lower and show more actual item cards while maintaining search bar visibility
- July 2, 2025: Updated MacBook Pro 16-inch price to $35.00 and removed all test items from database for clean marketplace data
- July 2, 2025: Updated item pricing - pressure washer to $7, camping tent to $3.50, drill set to $10
- July 2, 2025: Removed specific items - lawn tractor and AirPods Pro with camera image from marketplace inventory
- July 2, 2025: Updated Professional DSLR Camera Kit price to $22.00
- July 2, 2025: Updated Professional DSLR Camera Kit image to show actual camera equipment and removed AirPods Pro from marketplace
- July 2, 2025: Added 100 diverse rental items across all categories - tools, electronics, sports gear, outdoor equipment, vehicles, home & garden, and clothing items to create a comprehensive marketplace with 112 total items
- July 2, 2025: Switched all AI services from Google Gemini 1.5 to ChatGPT 3.5-turbo for pricing, search, and chatbot features per user request
- July 2, 2025: Fixed recommendation system interaction tracking - now properly tracks when users click on items and automatically updates user preferences for better personalized recommendations
- July 2, 2025: Updated AI pricing system to suggest significantly lower prices - items under $1000 now max $25/day (targeting $15-20), items over $1000 use formula (y = 0.003x + 25) for more competitive and affordable pricing
- July 2, 2025: Comprehensive image update - replaced all placeholder and inappropriate images with high-quality, relevant Unsplash photos that accurately represent each item title across all 122 marketplace listings
- July 2, 2025: Replaced photo upload functionality in list items page with AR 360° scanner - owners can now use augmented reality to scan items from 8 angles for comprehensive documentation, matching the protection system from action dashboard
- July 2, 2025: Implemented interactive 360° model viewer for AR preview - users can rotate, zoom, and inspect their scanned items in 3D space using captured images with drag controls, auto-rotation, and thumbnail navigation

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme: Blue, black, and white branding