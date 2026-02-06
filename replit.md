# KRANKLOG - Strength Training Workout Tracker

## Overview

KRANKLOG is a full-stack workout tracking application designed for serious strength athletes. It allows users to create training programs, define workouts with prescribed exercises, log sets with weight/reps/RPE, track "anchor" sets (top working sets), and visualize e1RM (estimated one-rep max) progress over time. The app uses a dark-themed, mobile-first UI with a lime green accent color and is branded as "Strength OS."

The core domain model flows: **Programs → Workouts → Workout Rows (prescribed exercises) → Logs (actual performance)**. Key strength training concepts like movement families (Squat, Bench, Deadlift, etc.), RPE-based intensity, anchor sets, and e1RM estimation are first-class citizens in the data model.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router, not React Router)
- **State/Data Fetching**: TanStack React Query for server state management. Custom hooks in `client/src/hooks/` wrap all API calls (`use-programs.ts`, `use-workouts.ts`, `use-logs.ts`, `use-stats.ts`, `use-auth.ts`)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives. All UI components live in `client/src/components/ui/`. Uses Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod resolvers for validation
- **Charts**: Recharts for e1RM progress visualization
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Design**: Dark mode only, mobile-first. Uses Teko (display font) and Inter (body font). The app has a sidebar nav on desktop and bottom tab bar on mobile
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express.js with TypeScript, running on Node.js
- **Server entry**: `server/index.ts` creates an HTTP server, registers routes, and serves static files in production or uses Vite dev server in development
- **API structure**: RESTful JSON API under `/api/*`. Route definitions with Zod schemas are shared between client and server in `shared/routes.ts`
- **Authentication**: Replit Auth via OpenID Connect (OIDC). Session-based auth using `express-session` with PostgreSQL session store (`connect-pg-simple`). Auth code lives in `server/replit_integrations/auth/`
- **Storage layer**: `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` class implementing all CRUD operations. This abstraction makes it easy to swap storage backends
- **Build process**: Custom build script (`script/build.ts`) that uses Vite for the client and esbuild for the server. Production output goes to `dist/`

### Shared Code
- **`shared/schema.ts`**: Drizzle ORM table definitions and Zod insert schemas. Contains all database models: programs, workouts, workoutRows, logs, plus enums for movement families and intensity types
- **`shared/routes.ts`**: API route contract definitions with paths, methods, Zod input/output schemas. Used by both client hooks and server route handlers for type safety
- **`shared/models/auth.ts`**: User and session table definitions required by Replit Auth

### Database
- **Database**: PostgreSQL via Drizzle ORM
- **Connection**: `server/db.ts` creates a `pg.Pool` from `DATABASE_URL` environment variable
- **Schema management**: `drizzle-kit push` for schema synchronization (configured in `drizzle.config.ts`)
- **Key tables**:
  - `users` - User profiles (Replit Auth managed)
  - `sessions` - Session storage (Replit Auth managed)
  - `programs` - Training program definitions
  - `workouts` - Individual workout days within programs
  - `workout_rows` - Prescribed exercises with sets/reps/intensity targets
  - `logs` - Actual logged performance (weight, reps, RPE, timestamps)

### Key Design Decisions
1. **Shared route contracts**: Zod schemas in `shared/routes.ts` ensure type-safe API communication without code generation. Both client and server import from the same source of truth
2. **Storage interface pattern**: The `IStorage` interface in `server/storage.ts` decouples business logic from database implementation
3. **Replit Auth integration**: Authentication is handled entirely through Replit's OIDC flow. The `setupAuth` function configures Passport.js with the OIDC strategy. All API routes use `isAuthenticated` middleware
4. **Mobile-first navigation**: Desktop uses a fixed left sidebar (64px wide), mobile uses a bottom tab bar with a floating action button for creating new programs
5. **Full CRUD with cascade deletes**: All entities (Programs, Workouts, Workout Rows, Logs) support Create, Read, Update (PATCH), and Delete operations. Deletes use explicit transactional cascades (logs → workout_rows → workouts → programs) since FK constraints don't have ON DELETE CASCADE. Log mutations enforce user ownership (userId check).
6. **React Query invalidation keys**: Use template-based keys `[path, id]` not resolved URLs. Programs: `["/api/programs"]` and `["/api/programs/:id", id]`. Workouts: `["/api/workouts/:id", id]`. Logs: `["/api/logs", JSON.stringify(params)]`. Stats: `["/api/stats/e1rm"]`, `["/api/stats/suggestions"]`.

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable. Required for both application data and session storage
- **Replit Auth (OIDC)**: Authentication provider. Uses `ISSUER_URL` (defaults to `https://replit.com/oidc`), `REPL_ID`, and `SESSION_SECRET` environment variables
- **Google Fonts**: Teko, Inter, DM Sans, Fira Code, Geist Mono, and Architects Daughter loaded via CDN in `client/index.html` and `client/src/index.css`
- **Recharts**: Client-side charting library for e1RM progress graphs
- **Framer Motion**: Animation library used on the landing page and for transitions
- **No external APIs**: The app is self-contained — no third-party fitness APIs, AI services, or payment processors are currently integrated (though the build script allowlists OpenAI, Stripe, and Google Generative AI for potential future use)