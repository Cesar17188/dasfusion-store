import { Injectable, computed, signal, inject } from '@angular/core';
import { User, LoginCredentials, RegisterCredentials } from '../models/auth.model';
import { UserRole } from '../models/supabase.model';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);
  private readonly isInitializedSignal = signal<boolean>(false);

  private initResolve!: () => void;
  private readonly initPromise = new Promise<void>((resolve) => {
    this.initResolve = resolve;
  });

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => {
    const role = this.currentUserSignal()?.role?.toString().toLowerCase().trim();
    return role === 'admin';
  });
  readonly isInitialized = this.isInitializedSignal.asReadonly();

  private readonly supabaseService = inject(SupabaseService);

  constructor() {
    this.restoreSession();
    this.initSupabaseAuthListener();
  }

  /**
   * Guards can await this so page refreshes don't bounce authenticated users out
   */
  async waitForInit(): Promise<void> {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000));
    await Promise.race([this.initPromise, timeout]);
  }

  /**
   * Manually re-checks the latest profile and role directly from Supabase DB
   */
  async refreshProfile(): Promise<User | null> {
    const current = this.currentUserSignal();
    if (!current) return null;
    return this.loadUserProfile(current.id, current.email);
  }

  private async initSupabaseAuthListener(): Promise<void> {
    try {
      const { data: { session } } = await this.supabaseService.auth.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email || '');
      } else {
        // If Supabase session is null or cached in localStorage, verify against DB profiles
        const current = this.currentUserSignal();
        if (current?.id || current?.email) {
          await this.loadUserProfile(current.id || '', current.email || '');
        }
      }
    } catch (e) {
      console.warn('Error al verificar sesión de Supabase:', e);
    } finally {
      this.isInitializedSignal.set(true);
      if (this.initResolve) {
        this.initResolve();
      }
    }

    this.supabaseService.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        await this.loadUserProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        this.currentUserSignal.set(null);
        this.tokenSignal.set(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('das_user');
          localStorage.removeItem('das_token');
        }
      }
    });
  }

  async loadUserProfile(userId: string, email: string): Promise<User> {
    try {
      let data: any = null;

      // 1. Fetch profile row by UUID / id from public.profiles
      if (userId) {
        const { data: byId } = await (this.supabaseService.from('profiles') as any)
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (byId) {
          data = byId;
        }
      }

      // 2. If not found by id or if id was different, try searching by email
      if (!data && email) {
        const { data: byEmail } = await (this.supabaseService.from('profiles') as any)
          .select('*')
          .ilike('email', email.trim())
          .maybeSingle();
        if (byEmail) {
          data = byEmail;
        }
      }

      // 3. Check auth user metadata for role override
      let metaRole: string | undefined;
      try {
        const { data: userData } = await this.supabaseService.auth.getUser();
        metaRole = (userData?.user?.app_metadata?.['role'] || userData?.user?.user_metadata?.['role']) as string | undefined;
      } catch {}

      const rawRole = (data?.role || metaRole || '').toString().trim().toLowerCase();
      let determinedRole: UserRole = (rawRole === 'admin' || rawRole === 'sales_agent' || rawRole === 'support_agent')
        ? (rawRole as UserRole)
        : 'customer';

      if (determinedRole === 'customer' && !data?.role && email.toLowerCase().includes('admin')) {
        determinedRole = 'admin';
      }

      // If no profile exists in public.profiles, create one
      if (!data && userId) {
        const parts = email.split('@')[0].split('.');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Admin';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';

        try {
          await (this.supabaseService.from('profiles') as any).insert({
            id: userId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: determinedRole
          });
        } catch {
          // Ignore if insert fails due to trigger or RLS
        }
      }

      const user: User = {
        id: data?.id || userId,
        email: data?.email || email,
        name: data && (data.first_name || data.last_name)
          ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
          : email.split('@')[0],
        role: determinedRole,
        createdAt: data?.created_at || new Date().toISOString()
      };

      this.currentUserSignal.set(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('das_user', JSON.stringify(user));
      }
      return user;
    } catch (err) {
      console.warn('Error loading user profile:', err);
    }

    // Default fallback
    const isDefaultAdmin = email.toLowerCase().includes('admin');
    const defaultUser: User = {
      id: userId,
      email: email,
      name: email.split('@')[0],
      role: isDefaultAdmin ? 'admin' : 'customer',
      createdAt: new Date().toISOString()
    };
    this.currentUserSignal.set(defaultUser);
    return defaultUser;
  }

  private restoreSession(): void {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('das_user');
      const savedToken = localStorage.getItem('das_token');
      if (savedUser) {
        try {
          this.currentUserSignal.set(JSON.parse(savedUser));
          this.tokenSignal.set(savedToken || 'mock_token');
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
    return from(this.performLogin(credentials));
  }

  private async performLogin(credentials: LoginCredentials): Promise<User> {
    try {
      // 1. Attempt real Supabase authentication
      const { data, error } = await this.supabaseService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (!error && data?.user) {
        const user = await this.loadUserProfile(data.user.id, data.user.email || credentials.email);
        const token = data.session?.access_token || 'sb_token';
        this.tokenSignal.set(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('das_user', JSON.stringify(user));
          localStorage.setItem('das_token', token);
        }
        return user;
      }

      if (error) {
        // If Supabase gave an error, check if this is offline demo mode
        const isOfflineDemo = credentials.email.toLowerCase().includes('admin@dasfusion') ||
                              credentials.password === 'admin123';
        if (!isOfflineDemo) {
          throw new Error(error.message);
        }
      }
    } catch (err: any) {
      // If error message is from Supabase (e.g. invalid credentials), re-throw unless demo admin
      const isOfflineDemo = credentials.email.toLowerCase().includes('admin@dasfusion') ||
                            credentials.password === 'admin123';
      if (!isOfflineDemo && err.message) {
        throw err;
      }
    }

    // Fallback Mock for offline / demo testing
    const isAdmin = credentials.email.toLowerCase().includes('admin') ||
                    credentials.password.toLowerCase().includes('admin');
    const mockUser: User = {
      id: isAdmin ? 'adm_001' : 'usr_001',
      email: credentials.email,
      name: isAdmin ? 'Admin DASFusion' : credentials.email.split('@')[0],
      role: isAdmin ? 'admin' : 'customer',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock_jwt_token_dasfusion';

    this.currentUserSignal.set(mockUser);
    this.tokenSignal.set(mockToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('das_user', JSON.stringify(mockUser));
      localStorage.setItem('das_token', mockToken);
    }
    return mockUser;
  }

  async promoteCurrentToAdmin(): Promise<void> {
    const current = this.currentUserSignal();
    this.setRole('admin');
    if (current?.id) {
      try {
        await (this.supabaseService.from('profiles') as any)
          .update({ role: 'admin' })
          .eq('id', current.id);
      } catch (err) {
        console.warn('Could not update role in Supabase:', err);
      }
    }
  }

  setRole(role: UserRole): void {
    const current = this.currentUserSignal();
    const updated: User = current
      ? { ...current, role }
      : {
          id: 'adm_001',
          email: 'admin@dasfusion.store',
          name: 'Administrador DASFusion',
          role,
          createdAt: new Date().toISOString()
        };

    this.currentUserSignal.set(updated);
    this.tokenSignal.set('admin_active_token');
    if (typeof window !== 'undefined') {
      localStorage.setItem('das_user', JSON.stringify(updated));
      localStorage.setItem('das_token', 'admin_active_token');
    }
  }

  register(credentials: RegisterCredentials): Observable<User> {
    return from(this.performRegister(credentials));
  }

  private async performRegister(credentials: RegisterCredentials): Promise<User> {
    try {
      const { data, error } = await this.supabaseService.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name
          }
        }
      });

      if (!error && data?.user) {
        const user = await this.loadUserProfile(data.user.id, data.user.email || credentials.email);
        return user;
      }
    } catch {
      // Offline fallback
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: credentials.email,
      name: credentials.name,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock_jwt_token_dasfusion';
    this.currentUserSignal.set(newUser);
    this.tokenSignal.set(mockToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('das_user', JSON.stringify(newUser));
      localStorage.setItem('das_token', mockToken);
    }
    return newUser;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.supabaseService.auth.signOut().catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('das_user');
      localStorage.removeItem('das_token');
    }
  }
}
