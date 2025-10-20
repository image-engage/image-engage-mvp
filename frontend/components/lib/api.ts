// src/lib/api.ts (or wherever your api.ts is located)

// Assuming you have a type defined for your API responses, e.g.:
// types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message2: string; // Renamed from 'message' to match your backend
  data?: T;
}

// Custom Error Class for API responses
export class ApiError extends Error {
  statusCode: number;
  responseBody?: any; // To hold the parsed JSON error body from the backend

  constructor(message: string, statusCode: number, responseBody?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;

    // Set the prototype explicitly to ensure correct 'instanceof' checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';

// Helper function to get the authentication token
// In a real application, you would retrieve this from localStorage,
// a global state management library (e.g., Zustand, Redux), or a NextAuth session.
const getAuthToken = (): string | undefined => {
  // Example: retrieve from localStorage (replace with your actual auth logic)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || undefined;
  }
  return undefined;
};


export const api = {
  // Generic type T for the expected successful response data
  async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null); // Try to parse, ignore if not JSON
      throw new ApiError(
        `API Error: ${response.status} - ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<T>; // Cast to the generic type T
  },

  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        `API Error: ${response.status} - ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<T>;
  },


   async postFormData<T>(endpoint: string, formData: FormData, token?: string): Promise<T> {
    const headers: HeadersInit = {}; // No 'Content-Type' header for FormData

    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData, // Pass FormData directly
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        `API Error: ${response.status} - ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<T>;
  },

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        `API Error: ${response.status} - ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<T>;
  },

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        `API Error: ${response.status} - ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<T>;
  },
};