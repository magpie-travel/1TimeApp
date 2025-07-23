# Memory App - Replit Documentation

## Overview

This is a full-stack memory journaling application built with React, Express.js, and PostgreSQL. The app allows users to create, store, and manage personal memories through both text and audio recordings. It features a modern UI with shadcn/ui components and includes AI-powered transcription and memory prompts.

## User Preferences

Preferred communication style: Simple, everyday language.
Deployment preference: Abandon custom domain deployment for now due to build complexity.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite with custom configuration
- **UI Library**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Handling**: Multer for audio file uploads
- **Session Management**: Connect-pg-simple for PostgreSQL sessions
- **Development**: Hot reload with Vite middleware integration

### Database Schema
The application uses three main tables:
- **Users**: Stores user authentication and profile information
- **Memories**: Contains memory content, metadata, and audio information
- **Memory Prompts**: Predefined prompts categorized by themes like childhood, travel, etc.

## Key Components

### Authentication System
- Custom authentication service using PostgreSQL storage
- Support for email/password authentication
- Placeholder implementations for Google and Apple OAuth
- Session-based authentication with persistent storage

### Memory Management
- **Text Memories**: Rich text content with metadata
- **Audio Memories**: Voice recordings with AI transcription
- **Mixed Content**: Combination of text and audio
- **Metadata**: People, locations, emotions, and timestamps
- **Sharing**: Public sharing via secure tokens

### Audio Processing
- Web Audio API for recording
- OpenAI Whisper API for transcription
- Audio player component with playback controls
- File upload handling with size limits

### AI Integration
- OpenAI GPT-4o for generating memory prompts
- Whisper API for audio transcription
- Sentiment analysis capabilities (configured but not fully implemented)

### UI Components
- Mobile-first responsive design
- Bottom navigation for mobile experience
- Floating action button for quick memory creation
- Card-based timeline layout
- Search and filtering functionality

## Data Flow

1. **User Authentication**: Login/registration through custom auth service
2. **Memory Creation**: 
   - Text: Direct input with metadata
   - Audio: Record → Upload → Transcribe → Store
3. **Memory Display**: Timeline view with filtering and search
4. **Memory Sharing**: Generate secure tokens for public access
5. **Prompts**: AI-generated or predefined prompts to inspire memories

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **UI**: @radix-ui components, Tailwind CSS, shadcn/ui
- **State**: @tanstack/react-query for server state management
- **Forms**: react-hook-form with @hookform/resolvers
- **Audio**: Native Web Audio API with custom hooks

### AI Services
- **OpenAI**: GPT-4o for prompt generation, Whisper for transcription
- **Configuration**: Requires OPENAI_API_KEY environment variable

### Development Tools
- **Vite**: Build tool with React plugin
- **TypeScript**: Type safety across the stack
- **ESLint/Prettier**: Code formatting and linting
- **Replit Integration**: Special plugins for Replit environment

## Deployment Strategy

### Environment Configuration
- **Development**: Uses Vite dev server with Express middleware
- **Production**: Builds static assets, serves via Express
- **Database**: PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY

### Build Process
1. **Frontend**: Vite builds React app to dist/public
2. **Backend**: ESBuild compiles TypeScript server to dist/
3. **Database**: Drizzle migrations run via `npm run db:push`

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── dist/           # Built application
```

## Recent Changes

### January 2025
- **Database Infrastructure Added**: Created complete PostgreSQL database setup with Drizzle ORM
- **Storage Architecture**: Implemented both in-memory and database storage options
- **Schema Design**: Built comprehensive database schema for users, memories, and prompts
- **Migration System**: Created database initialization and migration scripts
- **Advanced Semantic Search**: Implemented AI-powered search using OpenAI embeddings
  - Natural language query understanding (e.g., "Show me happy moments with friends")
  - Intelligent query expansion with related search terms
  - Semantic similarity scoring and explanations
  - Dual-mode search interface (AI Search + Keyword Search)
  - Enhanced UI with progress indicators and match percentage badges
- **Memory Creation Flow Redesign**: Completely redesigned memory creation with step-by-step approach
  - Step 1: Choose memory type with horizontal action buttons (Photos, Text, Audio)
  - Immediate actions: Click Photos to upload, Text to write, Audio to record
  - Step 2: Add/edit content based on type selection
  - Step 3: Name the memory with auto-filled text for audio
  - Step 4: Add tags, location, and people metadata
  - Progress indicator and validation between steps
  - Auto-advance after successful file uploads
  - Visual feedback for recording state
- **Import Modernization (January 23, 2025)**: Complete codebase import conversion
  - Fixed 78 TypeScript/TSX files across entire project
  - Frontend: All client imports use @ syntax (@/components, @/hooks, @/lib)
  - Backend: Server imports use .js extensions for ES module compatibility
  - Shared: @shared imports work across both client and server
  - Deployment-ready: ES module resolution issues completely resolved
- **Build System Fixes (January 23, 2025)**: Resolved TypeScript compilation errors
  - Fixed missing interface implementations in DatabaseStorage
  - Added missing sharing methods (shareMemoryWithUser, getMemoryShares, etc.)
  - Resolved type errors in OpenAI service and routes
  - Fixed missing schema fields (title, imageUrl, videoUrl, visibility, attachments)
  - **Production Build Success**: npm run build now completes without errors
- **Deployment Attempts**: Attempted multiple deployment platforms (Vercel, Railway)
  - Created various build configurations (build-manual.js, build-final.js, build-railway.js)
  - Resolved Tailwind CSS and path resolution issues
  - Build process working locally but complex project structure causes deployment challenges
- **Current Status**: App fully functional locally with clean codebase and successful builds
- **Deployment Decision**: Custom domain deployment temporarily abandoned due to build complexity
- **Alternative Options**: App ready for Replit deployment or simplified hosting solutions

### Storage Options Available
- **In-Memory Storage** (Current): Fast development, data lost on restart
- **PostgreSQL Database**: Persistent storage, production-ready, full feature support
- **Easy Migration**: One-line configuration change to switch storage types

The application is designed to run on Replit with special development mode features and can be deployed to any Node.js hosting platform with PostgreSQL support.