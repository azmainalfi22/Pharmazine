/**
 * Centralized API Configuration for Sharkar Pharmacy Management System
 * Use this instead of hardcoding API_BASE in individual files
 */

/**
 * Determine the base URL based on environment
 * Priority: ENV variable > Auto-detect > Fallback
 */
const getBaseUrl = (): string => {
  // 1. Check if explicitly set via environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Auto-detect based on current location (for production)
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // If running on a domain (not localhost), use relative API path
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}/api`;
    }
  }
  
  // 3. Development fallback - Backend on port 8000
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

export const API_CONFIG = {
  BASE_URL,
  PHARMACY_BASE: `${BASE_URL}/api/pharmacy`,
  HRM_BASE: `${BASE_URL}/api/hrm`,
  SERVICES_BASE: `${BASE_URL}/api/services`,
  CRM_BASE: `${BASE_URL}/api/crm`,
  FINANCE_BASE: `${BASE_URL}/api/finance`,
  AUTO_REORDER_BASE: `${BASE_URL}/api/auto-reorder`,
  NOTIFICATIONS_BASE: `${BASE_URL}/api/notifications`,
  BACKUP_BASE: `${BASE_URL}/api/backup`,
  TIMEOUT: 30000, // 30 seconds
  
  // Helper to check environment
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

/**
 * Helper function to get auth headers
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Helper function for API calls with proper error handling
 */
export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || errorData.detail || `HTTP Error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

