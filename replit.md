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
- **Make Booking**: Request rental with date selection and messaging
- **List Item**: Create new rental listings with images and details
- **Real-time Notifications**: Instant alerts for owners when rental requests are made

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

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme: Blue, black, and white branding