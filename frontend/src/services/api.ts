import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthResponse, User, Session, CreateSessionData, Venue } from '../types';

// Use your backend URL - update this to match your backend server
const API_BASE_URL = 'http://localhost:4000';

// Secure storage utility with fallback for web/development
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore deleteItem error:', error);
    }
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth token to request:', config.url);
      } else {
        console.log('No auth token found for request:', config.url);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Auth error detected, clearing token');
      await secureStorage.deleteItem('authToken');
    }
    return Promise.reject(error);
  }
);

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

  getHostedSessions: async (): Promise<Session[]> => {
    const response = await api.get('/sessions/hosted');
    return response.data;
  },

  getSession: async (id: string): Promise<Session> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  createSession: async (sessionData: CreateSessionData): Promise<Session> => {
    console.log('API: Creating session with data:', sessionData);
    try {
      const response = await api.post('/sessions', sessionData);
      console.log('API: Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Session creation failed:', error);
      throw error;
    }
  },

  joinSession: async (id: string): Promise<Session> => {
    const response = await api.post(`/sessions/${id}/join`);
    return response.data;
  },

  leaveSession: async (id: string): Promise<Session> => {
    const response = await api.post(`/sessions/${id}/leave`);
    return response.data;
  },

  deleteSession: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/sessions/${id}`);
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
