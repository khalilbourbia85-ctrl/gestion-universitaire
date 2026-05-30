/**
 * Axios Configuration with Error Handling
 * Centralizes all API calls and error management
 */
import axios from 'axios';

// Set base URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  // Note: Do NOT set Content-Type header here - let axios detect it automatically
  // For JSON: axios will auto-set 'application/json'
  // For FormData: axios will auto-set 'multipart/form-data' with boundary
});

// Create a separate instance for authentication (no /api prefix)
export const authAxios = axios.create({
  baseURL: '/',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authAxios
authAxios.interceptors.request.use(
  (config) => {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    console.debug(`[AUTH Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Auth request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for authAxios
authAxios.interceptors.response.use(
  (response) => {
    console.debug(`[AUTH Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    console.error(`[AUTH Error] ${status}:`, {
      url: error.config?.url,
      status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Request interceptor: Add authentication token and set Content-Type
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    
    // Only set Content-Type for non-FormData requests
    // FormData will automatically set 'multipart/form-data' with the correct boundary
    if (!config.data || !(config.data instanceof FormData)) {
      if (config.method !== 'get' && config.method !== 'head' && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data instanceof FormData) {
      console.debug(`  - FormData with fields:`, Array.from(config.data.entries()).map(([k, v]) => `${k}: ${v.name || typeof v}`));
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    console.debug(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Log error details
    console.error(`[API Error] ${status}:`, {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status,
      data,
      message: error.message
    });
    
    // Handle specific error cases
    if (status === 401) {
      console.warn('[AUTH] Authentification failed - Token expired or invalid');
      // Don't clear localStorage here - let the component handle redirect
    } else if (status === 403) {
      console.warn('[PERM] Access forbidden - Insufficient permissions');
    } else if (status === 404) {
      console.warn('[NOTFOUND] Resource not found');
    } else if (status === 500) {
      console.error('[SERVER] Server error - Internal server error');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
