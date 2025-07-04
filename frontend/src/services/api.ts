import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User, Session, CreateSessionData, Venue } from '../types';

// Use your backend URL - update this to match your backend server
const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
// api.interceptors.request.use(async (config) => {
//   const token = await SecureStore.getItemAsync('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    console.log('API: Making login request to:', `${API_BASE_URL}/auth/login`);
    console.log('API: Request data:', { email, password: '***' });
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('API: Login response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Login request failed:', error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  googleAuth: async (email: string, name: string, googleId: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { email, name, googleId });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Sessions API
export const sessionsAPI = {
  getAllSessions: async (): Promise<Session[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },

  getSession: async (id: string): Promise<Session> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  createSession: async (sessionData: CreateSessionData): Promise<Session> => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },

  joinSession: async (id: string): Promise<Session> => {
    const response = await api.post(`/sessions/${id}/join`);
    return response.data;
  },

  leaveSession: async (id: string): Promise<Session> => {
    const response = await api.post(`/sessions/${id}/leave`);
    return response.data;
  },
};

// Venues API
export const venuesAPI = {
  getVenues: async (sport: string): Promise<Venue[]> => {
    const response = await api.get(`/venues?sport=${sport}`);
    return response.data;
  },

  createVenue: async (name: string, sport: string): Promise<Venue> => {
    const response = await api.post('/venues', { name, sport });
    return response.data;
  },
};

export default api;
