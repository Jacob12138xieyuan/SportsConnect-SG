// User types
export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  googleId?: string;
  avatar?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Session types
export interface Session {
  _id: string;
  sport: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  courtNumber?: string; // Optional court number for court-based sports
  skillLevelStart: string;
  skillLevelEnd: string;
  hostName: string;
  hostId: User | string;
  currentPlayers: number;
  maxPlayers: number;
  fee: number;
  notes?: string;
  participants?: (User | string)[];
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
}

export interface CreateSessionData {
  sport: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  courtNumber?: string; // Optional court number for court-based sports
  skillLevelStart: string;
  skillLevelEnd: string;
  hostName: string;
  maxPlayers: number;
  fee: number;
  notes?: string;
  countHostIn: boolean;
}

// Venue types
export interface Venue {
  _id: string;
  name: string;
  sport: string;
  createdAt: string;
  updatedAt: string;
}

// API Error type
export interface ApiError {
  error: string;
  details?: any;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser?: (updatedUser: User) => void;
  isLoading: boolean;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Sessions:
    | undefined
    | {
        screen: 'SessionList';
      }
    | {
        screen: 'SessionDetail';
        params: { sessionId: string };
      };
  CreateSession: undefined;
  Messages: undefined;
  Profile:
    | undefined
    | {
        screen: 'ProfileMain';
      }
    | {
        screen: 'HostedSessions';
      };
};

export type SessionStackParamList = {
  SessionList: undefined;
  SessionDetail: { sessionId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  HostedSessions: undefined;
  SessionDetail: { sessionId: string };
};
