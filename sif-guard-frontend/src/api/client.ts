import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.detail || error.message || 'An unknown network error occurred';
    console.error('[SIF-Guard API Error]:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);
