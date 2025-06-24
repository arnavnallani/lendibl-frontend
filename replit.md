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

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme: Blue, black, and white branding