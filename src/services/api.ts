import config from '../config/environment';
import type {
  ApiResponse,
  SimplifiedCoursesResponse,
  CoursesResponse,
  CategoriesResponse,
  HealthCheckResponse,
} from '../types/api';

class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(
    message: string,
    status?: number,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

class MoodleApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private async makeRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      if (config.isDevelopment) {
        console.log(`🌐 API Request: ${url}`);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP Error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success && data.error) {
        throw new ApiError(
          data.error.message,
          response.status,
          data.error.code
        );
      }

      return data;
    } catch (error) {
      if (config.isDevelopment) {
        console.error('🚨 API Error:', error);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown API error'
      );
    }
  }

  // Health Check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await this.makeRequest<HealthCheckResponse>('/health');
    return response.data!;
  }

  // Categories
  async getCategories(parentId?: number): Promise<CategoriesResponse> {
    const endpoint = parentId !== undefined 
      ? `/categorias?parent=${parentId}` 
      : '/categorias';
    const response = await this.makeRequest<CategoriesResponse>(endpoint);
    return response.data!;
  }

  async getRootCategories(): Promise<CategoriesResponse> {
    const response = await this.makeRequest<CategoriesResponse>('/categorias/raiz');
    return response.data!;
  }

  // Courses - Full Data
  async getCoursesByCategory(categoryId: number): Promise<CoursesResponse> {
    const response = await this.makeRequest<CoursesResponse>(`/cursos/categoria/${categoryId}`);
    return response.data!;
  }

  async getCoursesByField(field: string, value: string): Promise<CoursesResponse> {
    const response = await this.makeRequest<CoursesResponse>(`/cursos/field/${field}/${value}`);
    return response.data!;
  }

  // Courses - Simplified Data (NEW)
  async getSimplifiedCoursesByCategory(categoryId: number): Promise<SimplifiedCoursesResponse> {
    const response = await this.makeRequest<SimplifiedCoursesResponse>(`/cursos/categoria/${categoryId}/simplificado`);
    return response.data!;
  }

  // Utility methods
  formatDate(timestamp: number): string {
    // Return empty string for zero timestamps (no end date)
    if (!timestamp || timestamp === 0) {
      return '';
    }
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  formatDateTime(timestamp: number): string {
    // Return empty string for zero timestamps
    if (!timestamp || timestamp === 0) {
      return '';
    }
    return new Date(timestamp * 1000).toLocaleString();
  }

  isValidCategoryId(id: any): boolean {
    return typeof id === 'number' && id > 0;
  }
}

// Export singleton instance
export const apiService = new MoodleApiService();
export { ApiError };
export default apiService;
