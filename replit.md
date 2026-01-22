# Glacier Simulation Game

## Overview

This is an interactive glacier simulation game where players select a glacier, manage environmental factors, and try to prevent it from melting. The application features a scientific dark-mode UI with real-time visualizations, ice core drill analysis, and a scoring/leaderboard system.

The game flow is:
1. Select a glacier from dynamically generated options
2. Run a simulation by adjusting environmental controls (temperature, snowfall, emissions, ocean temp)
3. View results and submit scores to a leaderboard

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables for theming (scientific dark mode palette)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization (temperature, CO2, glacier stats over time)
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints defined in shared route contracts
- **Validation**: Zod schemas for input validation and type safety

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines tables for glaciers and scores
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schema definitions and API contracts used by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code
- **Type-Safe API**: Route definitions include Zod schemas for request/response validation
- **Custom Simulation Hook**: `useSimulation` manages game state, environmental factors, and glacier physics calculations

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including glacier canvas, controls
    pages/        # Route pages (SelectGlacier, Simulation, Results)
    hooks/        # Custom hooks (simulation logic, data fetching)
server/           # Express backend
  routes.ts       # API endpoint handlers
  storage.ts      # Database access layer
  db.ts           # Drizzle database connection
shared/           # Shared between client/server
  schema.ts       # Drizzle table definitions
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### UI Framework
- **Radix UI**: Accessible component primitives (dialogs, sliders, tooltips, etc.)
- **shadcn/ui**: Pre-built component library using Radix + Tailwind
- **Lucide React**: Icon library

### Data & Visualization
- **Recharts**: Charting library for time-series data
- **Embla Carousel**: Carousel component

### Fonts (Google Fonts)
- DM Sans: Primary sans-serif font
- Fira Code: Monospace font for data displays
- Architects Daughter: Display/decorative font
- Geist Mono: Alternative monospace

### Development Tools
- **Vite**: Frontend build and dev server with HMR
- **esbuild**: Production server bundling
- **Replit plugins**: Runtime error overlay, cartographer, dev banner