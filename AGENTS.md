# AGENTS.md: AI Collaboration Guide

This document provides essential context for AI models interacting with this **React + TypeScript + Bun** project. Adhering to these guidelines ensures consistency and maintainability.

## 1. Project Overview & Purpose

*   **Primary Goal:** "Next Stop" is a comprehensive travel planning application (SaaS/Tool) that combines a Kanban board for itinerary management with interactive map integration and real-time synchronization.
*   **Business Domain:** Travel Technology, Productivity, Trip Planning.

## 2. Core Technologies & Stack

*   **Runtime & Package Manager:** Bun (Recommended for installation and running scripts, as indicated by `bun.lock`).
*   **Frontend Framework:** React 18 (Vite-based SPA).
*   **Language:** TypeScript (Loose strictness: `noImplicitAny` and `strictNullChecks` are currently **disabled**).
*   **State Management:**
    *   **Server State:** TanStack Query (`@tanstack/react-query`).
    *   **Global UI State:** React Context (e.g., `src/contexts`).
*   **Styling & UI:**
    *   Tailwind CSS (v3.4).
    *   Shadcn/ui (Radix UI primitives).
    *   `lucide-react` for icons.
*   **Key Libraries:**
    *   **Validation:** Zod + React Hook Form.
    *   **Maps:** MapLibre GL + React Map GL.
    *   **Drag & Drop:** `@dnd-kit/core`.
    *   **Dates:** `date-fns`.
    *   **Backend:** Firebase (Firestore, Auth).

## 3. Architectural Patterns

*   **Overall Architecture:** Component-based SPA with Feature-based organization in hooks. Logic is often decoupled from UI via custom hooks.
*   **Directory Structure Philosophy:**
    *   `/src/components`: Shared UI components and feature-specific components.
        *   `/src/components/ui`: Shadcn/ui reusable primitives (Do not modify unless necessary).
    *   `/src/hooks`: Contains the core business logic and state manipulations (e.g., Kanban operations).
    *   `/src/contexts`: React Context providers.
    *   `/src/services`: Firebase and external API service layers.
    *   `/src/pages`: Route-level page components.
*   **Data Fetching Strategy:** Client-side fetching using **TanStack Query** for caching and synchronization with Firebase.

## 4. Coding Conventions & Style Guide

*   **TypeScript Usage:**
    *   **Strictness:** The project currently uses **loose typing** (`strictNullChecks: false`).
    *   *AI Instruction:* When creating *new* files, prefer strict types. When editing *existing* files, respect the current loose typing to avoid cascading errors, but improve type safety where feasible without breaking changes.
*   **Component Patterns:**
    *   Functional components with named exports or `export default`.
    *   Preference for **Controlled Components** when wrapping UI libraries.
*   **Naming Conventions:**
    *   **Components:** PascalCase (`DashboardView.tsx`, `KanbanCard.tsx`).
    *   **Hooks:** camelCase starting with 'use' (`useKanbanData.ts`).
    *   **Files:** PascalCase for components, camelCase for utilities/hooks.
*   **Error Handling:**
    *   **UI Feedback:** Uses `sonner` for toast notifications (`toast.error(...)`).
    *   **Validation:** Zod schemas are used for form validation.

## 5. Key Files & Entrypoints

*   **Main Entrypoint:** `src/main.tsx` (Bootstraps the App and Context Providers).
*   **Configuration:**
    *   `package.json`: Dependency definitions.
    *   `vite.config.ts`: Build configuration.
    *   `tailwind.config.ts`: Styling configuration.
    *   `eslint.config.js`: Linting rules.
*   **CI/CD Pipeline:** None detected in `.github/workflows`.

## 6. Development & Testing Workflow

*   **Scripts:**
    *   `bun run dev` (or `npm run dev`): Starts the Vite development server.
    *   `bun run build`: Builds the application for production.
    *   `bun run lint`: Runs ESLint.
*   **Testing:**
    *   **Framework:** **Vitest** (configured in `vite.config.ts` or via `vitest` dependency).
    *   **Convention:** Test files are colocated or found in `src` with `*.test.ts` extension.
*   **Code Quality:**
    *   **Linter:** ESLint (v9) with `typescript-eslint`.
    *   **Formatter:** Prettier (inferred usage via IDE/plugins, no explicit config file found).

## 7. Specific Instructions for AI Collaboration

*   **Code Generation Rules:**
    *   **Styling:** Always use Tailwind CSS utility classes. Use `cn()` (clsx + tailwind-merge) for conditional class names.
    *   **UI Components:** Reuse existing components in `src/components/ui` (Shadcn) before creating new ones.
    *   **Imports:** Use the `@/` path alias (e.g., `import { Button } from "@/components/ui/button"`).
*   **Dependency Management:** "Use `bun add` for new packages. Ensure compatibility with the Bun runtime."
*   **Security:** "Never expose variables prefixed with `VITE_` (or `NEXT_PUBLIC_`) unless intended for the client. Use environment variables for Firebase secrets."
*   **Commit Messages:** The project does not strictly follow Conventional Commits. Use clear, descriptive messages (e.g., "Update DashboardView layout", "Fix permission bug").
