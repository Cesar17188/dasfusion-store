export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'customer' | 'admin';
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
