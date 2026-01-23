# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

Project uses React + TypeScript + Vite.

- **Install dependencies**
  - `npm install`

- **Run dev server**
  - `npm run dev`
  - Uses Vite dev server and the environment in `.env.development` / `.env.local`.

- **Build for production**
  - `npm run build`

- **Preview production build locally**
  - `npm run preview`

- **Lint the project**
  - `npm run lint`

### Environment configuration

- Environment variables are centralized in `src/config/environment.ts`.
- Typical files:
  - `.env.development` — dev defaults (see `ENVIRONMENT_SETUP.md`).
  - `.env.production` — production values.
  - `.env.local` — developer overrides (gitignored).
- Key variables:
  - `VITE_API_BASE_URL` — base URL for the backend / Moodle proxy API.
  - `VITE_ENVIRONMENT` — human-friendly environment label (e.g. `development`, `production`).

See `ENVIRONMENT_SETUP.md` for the exact example values and available API methods.

## High-Level Architecture

This is a single-page React dashboard application that talks to a Moodle-proxy API. The main pieces are:

### Entry point and routing

- `src/main.tsx`
  - Bootstraps React with `ReactDOM.createRoot`.
  - Wraps the app with `BrowserRouter` and `AuthProvider` (authentication context).
- `src/App.tsx`
  - Defines the route layout using `react-router-dom` `Routes`/`Route`.
  - Uses a `Header` layout component (hidden on the login route).
  - All non-login routes are wrapped in `ProtectedRoute` to enforce authentication and, for some routes, role-based access control.
  - Key routes:
    - `/` → `LoginPage` (public login screen).
    - `/dashboard` → main dashboard.
    - `/inscripciones` → inscriptions management.
    - `/modalidad` → modality configuration.
    - `/ejecutivos` → executives.
    - `/participantes/:numeroInscripcion` → participants list for a specific inscription.
    - `/empresas`, `/usuarios` → admin-only routes (`requiredRole="superAdmin"`).

### Auth and RBAC

- `src/context/AuthContext.tsx`
  - Holds `user` state (`AuthUser | null`).
  - Exposes `login(username, password)` and `logout()` via React context.
  - `login` delegates to `loginUser` from `src/services/users.ts`, maps the server user to `{ username, role }`, and stores it in context.
  - `useAuth()` is the hook used by components (including `ProtectedRoute`) to read auth state.
- `src/components/ProtectedRoute.tsx` (not shown here but referenced from `App.tsx`)
  - Uses `useAuth()` to guard routes.
  - Some routes provide `requiredRole="superAdmin"` to enforce RBAC at the routing layer.

### Configuration and environment

- `src/config/environment.ts`
  - Single source of truth for runtime config derived from Vite env vars.
  - Exports `config` with:
    - `apiBaseUrl` — taken from `VITE_API_BASE_URL` (default `http://localhost:3500/api`).
    - `environment` — from `VITE_ENVIRONMENT` or `development`.
    - `isDevelopment` / `isProduction` — based on `import.meta.env.MODE`.
  - Throws if `apiBaseUrl` is missing, so misconfigured environments fail fast.
  - Logs effective configuration in development mode.

### API / data layer

All server interaction is abstracted in `src/services/`.

- `src/services/api.ts`
  - Generic, strongly-typed wrapper for Moodle-proxy endpoints.
  - Uses `config.apiBaseUrl` as base URL.
  - `MoodleApiService` provides methods:
    - `healthCheck()` — basic connectivity.
    - `getCategories(parentId?)` and `getRootCategories()` — course categories.
    - `getCoursesByCategory(categoryId)` / `getCoursesByField(field, value)` — full course data.
    - `getSimplifiedCoursesByCategory(categoryId)` — reduced dataset for dashboards.
    - `formatDate(timestamp)` / `formatDateTime(timestamp)` — helper formatting (handles `0` timestamps as empty strings).
    - `isValidCategoryId(id)` — small validation helper.
  - Implements a shared `makeRequest<T>()` that:
    - Logs the URL in development.
    - Throws a custom `ApiError` on HTTP or API-level errors.

- `src/services/users.ts`
  - Handles user and auth-related operations against the API.
  - Uses `config.apiBaseUrl` (aliased to `BASE_URL`).
  - Contains a private `request<T>()` helper that expects the common `ApiResponse<T>` envelope and throws on `success === false`.
  - Public functions:
    - `listUsers()` — fetches `/users`, maps `_id` to `id` and normalizes shape.
    - `loginUser(username, password)` — posts to `/users/login`, returns `StoredUser` or `null` on invalid credentials.
    - `createUser(username, role, password)` — POST `/users`.
    - `updateUser(id, data)` — PUT `/users/:id`.
    - `changePassword(id, newPassword)` — POST `/users/:id/password`.
    - `deleteUser(id)` — DELETE `/users/:id`.

- `src/services/inscripciones.ts`
  - Manages inscriptions CRUD and import operations.
  - Strongly typed `Inscripcion` interface contains both business and metadata fields (e.g., `numeroInscripcion`, `correlativo`, `codigoCurso`, `idMoodle`, `modalidad`, `statusAlumnos`, etc.).
  - Uses a local `ApiResponse<T>` type and `BASE = `${config.apiBaseUrl}/inscripciones``.
  - Provided operations:
    - `list()` — GET list of inscriptions.
    - `create(payload)` — POST, enforces `empresa: 'Mutual'` and strips `numeroInscripcion` if not present.
    - `update(id, payload)` — PUT single inscription.
    - `delete(id)` — DELETE.
    - `importFromExcel(path, sheetName?)` — POST to `/inscripciones/import` for bulk import.

- Other services (`ejecutivos.ts`, `empresas.ts`, `modalidades.ts`, `participantes.ts`)
  - Follow a similar pattern: use `config.apiBaseUrl`, define local types, and provide focused, domain-specific helpers for each page.

### Pages and UI structure

- `src/pages/*.tsx`
  - Each page focuses on a particular domain (Dashboard, Inscripciones, Modalidad, Ejecutivos, Empresas, Participantes, Usuarios, Login).
  - Pages usually:
    - Use a `useEffect` `load()` function to fetch data from `src/services/*`.
    - Maintain local UI state for filters, pagination, forms, and dialog visibility.
    - Render composable components from `src/components/` for tables, forms, and layout.
- Examples:
  - `Inscripciones.tsx` coordinates inscriptions list, forms, and Excel import.
  - `Modalidad.tsx` uses `ModalidadForm` and `ModalidadTable` to manage modality configurations.
  - `Usuarios.tsx` uses the `users` service to implement user CRUD and password change UI, and enforces superadmin-only access via routing.

### Components

- `src/components/`
  - Shared UI and feature building blocks such as `Header`, `ProtectedRoute`, and domain-specific tables/forms (`ModalidadForm`, `ModalidadTable`, etc.).
  - Pages manage data and business logic; components focus on reusable presentation and local UI behavior (pagination, headers, dialogs).

## How Future Agents Should Work Here

- Prefer going through the `src/services/*` modules instead of calling `fetch` directly from components to keep the data layer consistent.
- When adding new features that rely on the backend API, mirror the existing pattern:
  - Add/extend a service in `src/services/`.
  - Consume it from a page or component using `useEffect`/hooks.
- Respect the auth model:
  - Use `AuthContext` for login/logout.
  - Use or extend `ProtectedRoute` for any new routes that require authentication or specific roles.
- For environment-dependent behavior, always read from `config` in `src/config/environment.ts` rather than accessing `import.meta.env` directly in new code.
