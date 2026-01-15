// Environment configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3500/api',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
} as const;

// Validate required environment variables
if (!config.apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL environment variable is required');
}

// Log configuration in development
if (config.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    apiBaseUrl: config.apiBaseUrl,
    environment: config.environment,
    mode: import.meta.env.MODE,
  });
}

export default config;
