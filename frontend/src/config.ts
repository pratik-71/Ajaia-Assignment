export const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_BACKEND_URL || 'https://ajaia-backend-production.vercel.app') 
  : 'http://localhost:5000';
