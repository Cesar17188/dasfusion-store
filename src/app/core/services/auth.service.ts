import { Injectable, computed, signal } from '@angular/core';
import { User, LoginCredentials, RegisterCredentials } from '../models/auth.model';
import { Observable, of, delay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('das_user');
      const savedToken = localStorage.getItem('das_token');
      if (savedUser && savedToken) {
        try {
          this.currentUserSignal.set(JSON.parse(savedUser));
          this.tokenSignal.set(savedToken);
        } catch {
          this.logout();
        }
      }
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  login(credentials: LoginCredentials): Observable<User> {
    // Mock login response for quick development/demo
    const mockUser: User = {
      id: 'usr_001',
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock_jwt_token_dasfusion';

    return of(mockUser).pipe(
      delay(600),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.tokenSignal.set(mockToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('das_user', JSON.stringify(user));
          localStorage.setItem('das_token', mockToken);
        }
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<User> {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: credentials.email,
      name: credentials.name,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock_jwt_token_dasfusion';

    return of(newUser).pipe(
      delay(600),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.tokenSignal.set(mockToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('das_user', JSON.stringify(user));
          localStorage.setItem('das_token', mockToken);
        }
      })
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('das_user');
      localStorage.removeItem('das_token');
    }
  }
}
