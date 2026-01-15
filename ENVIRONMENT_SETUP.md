# Environment Configuration

This document explains the environment setup for the Moodle Dashboard application.

## Environment Files

### Development Environment (`.env.development`)
```
VITE_API_BASE_URL=http://localhost:3500/api
VITE_ENVIRONMENT=development
```

### Production Environment (`.env.production`)
```
VITE_API_BASE_URL=https://api.cursos.educampus.cl
VITE_ENVIRONMENT=production
```

### Local Overrides (`.env.local`)
Copy `.env.local.example` to `.env.local` for local development overrides.
This file is gitignored and won't be committed to the repository.

## API Service

The application includes a complete API service (`src/services/api.ts`) that provides:

- **Health Check**: Test API connectivity
- **Categories**: Get course categories (root categories, with parent filtering)
- **Courses**: Get full course data or simplified course data
- **Error Handling**: Proper error handling with custom ApiError class
- **Type Safety**: Full TypeScript support with defined interfaces

### Available API Methods

```typescript
// Health check
await apiService.healthCheck();

// Get root categories
await apiService.getRootCategories();

// Get categories with parent filter
await apiService.getCategories(parentId);

// Get full course data
await apiService.getCoursesByCategory(categoryId);

// Get simplified course data (NEW ENDPOINT)
await apiService.getSimplifiedCoursesByCategory(categoryId);

// Utility methods
apiService.formatDate(timestamp);
apiService.formatDateTime(timestamp);
```

## Environment Configuration Module

The configuration is centralized in `src/config/environment.ts`:

```typescript
import config from './config/environment';

// Available properties:
config.apiBaseUrl      // Current API base URL
config.environment     // Current environment name
config.isDevelopment   // Boolean: true in development
config.isProduction    // Boolean: true in production
```

## Testing the Integration

The application includes a test component (`ApiTestComponent`) that can be accessed by clicking the "🧪 Test API Integration" button in the dashboard. This component:

1. Tests API health connectivity
2. Loads and displays root categories
3. Allows selecting a category to load simplified courses
4. Shows real data from your Moodle API

## Running the Application

### Development Mode
```bash
npm run dev
```
This will use the development environment configuration and connect to `http://localhost:3000/api`.

### Production Build
```bash
npm run build
```
This will use the production environment configuration and connect to `https://api.cursos.educampus.cl`.

### Preview Production Build
```bash
npm run preview
```
This will serve the production build locally for testing.

## Simplified Courses Endpoint

The new simplified endpoint `/cursos/categoria/:id/simplificado` returns only the essential course fields:

```typescript
interface SimplifiedCourse {
  id: number;          // Course ID
  fullname: string;    // Course full name
  startdate: number;   // Start date (Unix timestamp)
  enddate: number;     // End date (Unix timestamp)  
  students: number;    // Number of enrolled students
}
```

This endpoint is perfect for dashboard displays where you don't need all the course metadata.

## Next Steps

1. **Start the API server**: Make sure your Moodle API proxy is running on `http://localhost:3000`
2. **Test the integration**: Run `npm run dev` and click the "Test API Integration" button
3. **Verify data**: Check that categories and courses load correctly with student counts
4. **Integration**: Replace the test component with your actual dashboard components using the API service
