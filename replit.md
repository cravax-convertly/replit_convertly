# Cravax Convertly - PDF Conversion Tool

## Overview

Cravax Convertly is a freemium web application that allows users to convert PDF files to Word, Excel, or PowerPoint formats. The application is built with a modern full-stack architecture using React on the frontend and Express on the backend, with a focus on multilingual support and a clean, responsive user interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Extensive use of Radix UI primitives through shadcn/ui

### Backend Architecture
- **Primary Backend**: Express.js with TypeScript (existing)
- **Module System**: ES Modules
- **Development**: tsx for TypeScript execution in development
- **Production**: esbuild for server bundling
- **Database**: Replit Database (key-value store) replacing in-memory storage
  - Persistent user data, conversion tracking, and newsletter subscriptions
  - Automatic ID generation with counters
  - Email-based indexing for fast lookups
- **PDF Conversion Service**: FastAPI (Python) backend for file conversion
  - Location: `python-backend/` directory
  - Handles PDF to Word/Excel/PowerPoint conversion
  - Supabase JWT authentication
  - Automatic file cleanup after 1 hour

### Database & ORM
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL (via Neon serverless driver)
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Core Features
1. **PDF Conversion**: Convert PDF files to Word, Excel, or PowerPoint
2. **Freemium Model**: 
   - Free users: 1 conversion per 24 hours (signup required)
   - Premium users: €3/month for unlimited conversions
3. **Multilingual Support**: English, Portuguese, Spanish, and French
4. **User Management**: Registration, login, and premium subscription tracking

### Frontend Components
- **Header**: Navigation with logo, menu items, and language selector
- **Hero Section**: Main call-to-action and value proposition
- **Freemium Preview**: Simple side-by-side plan comparison
- **Plans Section**: Free vs Premium plan comparison (detailed)
- **Trust Section**: Security and feature highlights with emojis
- **Newsletter Section**: Email subscription with API integration
- **Footer**: Links and legal information
- **Upload Page**: PDF file upload with format selection and drag-and-drop

### Backend Services
- **Newsletter API**: Email subscription endpoint (Express) with persistent storage
- **Health Check**: Database monitoring endpoint with statistics (Express)
- **Storage Layer**: Replit Database implementation with key-value persistence
  - User management: `user:{id}`, `email:{email}`, `username:{username}` indexes
  - Newsletter tracking: `newsletter:{email}` with duplicate prevention
  - Conversion limits: `conversionsToday`, `lastConversion`, `isPremium` flags
  - Auto-incrementing IDs with `counter:user_id` and `counter:newsletter_id`
- **PDF Conversion API**: FastAPI service with endpoints:
  - `POST /api/convert` - Convert PDF files with authentication
  - `GET /download/{filename}` - Download converted files
  - File validation, size limits (10MB), and automatic cleanup

## Data Flow

1. **User Registration**: Required before any PDF conversion
2. **Conversion Limits**: Tracked per user with daily reset mechanism
3. **Premium Upgrades**: Stripe integration for payment processing
4. **File Processing**: Automatic deletion after 1 hour for privacy
5. **Newsletter**: Independent subscription system for marketing

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for premium subscription payments
- **Client-side**: @stripe/stripe-js and @stripe/react-stripe-js
- **Server-side**: Stripe webhook handling (implied by freemium model)

### Analytics
- **GoatCounter**: Privacy-focused analytics tracking

### Database
- **Neon**: Serverless PostgreSQL database
- **Connection**: Managed through environment variables

### UI & Styling
- **Fonts**: Google Fonts (Inter family)
- **Icons**: Lucide React for consistent iconography
- **Components**: Radix UI primitives for accessibility

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Vite HMR for frontend, tsx for backend
- **Environment**: NODE_ENV=development

### Production
- **Build Process**: 
  1. Vite builds frontend to `dist/public`
  2. esbuild bundles server to `dist/index.js`
- **Serving**: Express serves static files in production
- **Database**: Drizzle migrations applied via `db:push` command

### Configuration
- **TypeScript**: Unified config across client, server, and shared code
- **Path Aliases**: Configured for clean imports (@/, @shared/)
- **ESM**: Full ES module support across the stack

### Key Architectural Decisions

1. **Monorepo Structure**: Client, server, and shared code in single repository for easier development and deployment
2. **TypeScript-First**: Strong typing across the entire stack for better developer experience and reliability
3. **Component-Based UI**: Modular React components with shadcn/ui for consistency and maintainability
4. **API-First Backend**: RESTful endpoints designed for easy frontend integration
5. **Internationalization**: Built-in translation system for multi-language support
6. **Freemium Model**: User authentication required even for free usage to enable conversion tracking

### Recent Changes (January 2025)

- **Homepage Refinements**: Updated hero section messaging to clearly communicate signup requirement for freemium model
- **Trust Signals**: Added emoji-based trust section with key value propositions (🚀 🔒 ❌ 🌍)
- **Upload Page**: Created comprehensive PDF upload interface with drag-and-drop, format selection, and multilingual support
- **Translation Updates**: Extended translation system to support upload page functionality across all 4 languages
- **UI Components**: Added RadioGroup and Label components from Radix UI for better form controls
- **Authentication System**: Built complete Supabase auth with signup.html, login.html, and shared auth.js
- **FastAPI Backend**: Implemented secure PDF conversion service supporting Word, Excel, and PowerPoint formats
- **File Management**: Automatic file cleanup, size validation, and secure UUID-based naming
- **Frontend Integration**: Created upload.js to connect HTML forms to FastAPI backend with proper auth flow
- **Download System**: Built download.html page for converted file delivery with automatic cleanup notification
- **Final Download Page**: Complete multilingual download.html with auto-download functionality, 3-second countdown, spinner, and error handling
- **Server Routes**: Added Express routes to serve all standalone HTML and JS files (upload.html, download.html, signup.html, login.html)
- **Stripe Integration**: Built complete FastAPI Stripe subscription system with checkout sessions, webhook handling, and Supabase user updates
- **Payment Processing**: €3/month subscription with automatic premium status activation in Supabase
- **Database Migration**: Fully replaced in-memory storage with persistent Replit Database
  - Migrated user management, newsletter subscriptions, and conversion tracking
  - Added health check endpoints and database statistics
  - Implemented proper response handling for Replit DB key-value format
- **Stripe Webhook Integration**: Built Express webhook endpoint for premium user upgrades
  - Handles `checkout.session.completed` events with signature verification
  - Automatically upgrades users to premium status in Replit Database
  - Includes test endpoints for development and debugging
  - Comprehensive error handling and console logging
- **Production Fixes (July 2025)**: Fixed critical signup and download issues
  - **Signup Form**: Fixed auth.js with fallback authentication system when Supabase unavailable
  - **Download Auto-Download**: Implemented proper file download with authentication headers and blob handling
  - **Anonymous Upload + Auth Download**: Anonymous users can upload, must login to download
  - **File Conversion**: Express backend handles PDF conversion with authentication and freemium limits
  - **Complete User Flow**: End-to-end tested signup → upload → login → download workflow
- **4 Key UX Improvements (July 2025)**: Enhanced user experience and prevented common issues
  - **Welcome Email System**: Automated welcome emails sent via Resend API after successful user registration
  - **Duplicate Prevention**: Email validation during signup prevents duplicate accounts with clear error messages
  - **Profile Navigation**: Dynamic profile button appears after login, replaces login buttons in header navigation
  - **Enhanced File Upload**: Fixed drag-and-drop functionality, file preview, and browser file selection with proper validation
- **Critical Fixes (July 2025)**: Resolved 3 major production issues affecting core functionality
  - **Secure Download API**: Moved downloads from static `/downloads/` to authenticated `/api/download/:filename` endpoint
  - **Profile Page Authentication**: Fixed account.html with multi-layer auth check (localStorage + Supabase sessions)
  - **File Upload Enhancement**: Complete drag-and-drop with file validation, error handling, and proper event management
- **Consistent Navigation (July 2025)**: Added shared header and footer across all main pages
  - **Shared Header**: Logo, navigation links (Upload, Pricing, Account), and logout button with Supabase integration
  - **Shared Footer**: Simple copyright notice across all pages
  - **Pages Updated**: upload.html, account.html, pricing.html, success.html, not-found.html
  - **Responsive Design**: Hidden mobile navigation and consistent TailwindCSS styling
  - **Supabase Logout**: Integrated logout functionality across all pages with proper session management
- **Final Production Fixes (July 2025)**: Implemented 5 critical improvements for launch readiness
  - **Secure File Downloads**: Enhanced download.html with Supabase Bearer token authentication, proper error handling for 401/403/404 responses
  - **Enhanced Success Page**: Improved license key display with styled sections, better visual hierarchy and user messaging
  - **Account License Display**: Added premium license key section to account.html with conditional display based on user status
  - **Comprehensive Login Errors**: Implemented detailed error messages in simple-login.html for invalid credentials, unconfirmed emails, rate limits
  - **Authentication-Based Navigation**: Dynamic showing/hiding of Account/Login/Logout links based on Supabase session status across all pages
  - **Upload Error Handling**: Fixed MulterError handling in upload.js with specific error messages for auth, limits, and validation failures
- **QA Testing Fixes (July 2025)**: Resolved critical production issues discovered during comprehensive testing
  - **MulterError Resolution**: Fixed field name mismatch between upload.js ('pdf') and server routes ('file') causing upload failures
  - **Proper 404 Handling**: Implemented catch-all route that redirects non-existent pages to /not-found.html instead of returning 200 status
  - **API 404 Responses**: API endpoints now return proper JSON 404 responses instead of falling through to HTML handlers
  - **Route Configuration**: Added missing routes for pricing.html, success.html, and not-found.html ensuring all pages are accessible
  - **Login Redirect Fix**: Updated authentication redirects to use simple-login.html consistently across the application
- **Production Launch Fixes (July 2025)**: Final critical fixes for production deployment readiness
  - **Format Validation Fixed**: Backend now accepts both legacy ('word', 'excel', 'powerpoint') and new format values ('docx', 'xlsx', 'pptx')
  - **Homepage Created**: Added comprehensive index.html with hero section, features grid, and proper navigation
  - **Pricing Correction**: Updated pricing from €9.99/month to €3.99/month across all pages and components
  - **Conversion Logging**: Added detailed backend logging for file uploads, format validation, and conversion success/failure
  - **Secure Download URLs**: All conversions now return /api/download/ URLs instead of static /downloads/ paths
  - **Navigation Consistency**: Logo links to homepage (/) across all pages with unified header navigation
  - **Complete User Flow**: Verified end-to-end functionality: homepage → upload → convert → download with all formats (docx, xlsx, pptx)
- **Final Bug Fixes (July 2025)**: Resolved all 6 critical functional bugs for production readiness
  - **Stripe Checkout Integration**: Added /api/stripe/checkout endpoint for premium upgrades with proper payment flow
  - **Enhanced Authentication Flow**: Upload page now requires login, with proper session checks and redirects
  - **Format Validation Strictness**: Backend only accepts docx/xlsx/pptx formats, rejects invalid format values
  - **Error Handling Improvements**: Login/signup pages show alerts and inline error messages for failures
  - **Navigation Consistency**: All logos link to homepage, standardized logout confirmations across pages
  - **License Display System**: Success page shows premium license keys from Stripe checkout sessions
- **Production Ready (July 2025)**: Complete Stripe API integration activated with environment variables
  - **STRIPE_SECRET_KEY**: Configured for payment processing and subscription management
  - **STRIPE_WEBHOOK_SECRET**: Configured for secure webhook verification and user upgrades
  - **Payment Flow**: €3.99/month premium subscriptions with unlimited conversions active
  - **Security**: All endpoints protected with proper authentication and validation
  - **User Experience**: Complete signup → upload → convert → download workflow functional
- **Comprehensive Audit & Security Fixes (July 2025)**: Full codebase audit completed with all critical issues resolved
  - **Secure Download API**: All downloads use authenticated `/api/download/:filename` endpoints instead of static file access
  - **Navigation Consistency**: Added complete navigation headers with login/logout functionality to all pages (login.html, signup.html, not-found.html)
  - **Authentication Integration**: Dynamic navigation showing Account/Logout when logged in, Login/Sign Up when not authenticated
  - **Footer Standardization**: Fixed duplicate copyright notices, standardized to 2025 across all pages
  - **Form Error Handling**: Enhanced login/signup forms with proper Supabase integration and error display
  - **Download Security**: Implemented Bearer token authentication for file downloads with proper error handling
  - **Production Testing**: All pages (homepage, upload, login, signup, account, pricing, success, download, 404) tested and functional