import { UserRole } from './supabase.model';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
