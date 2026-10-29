import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/supabase.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  private publicSupabase: SupabaseClient<Database>;

  constructor() {
    this.cleanExpiredLocalSession();

    // Cliente principal con lock no bloqueante para evitar deadlocks de Navigator LockManager
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => await fn()
        }
      }
    );

    // Cliente público sin sesión persistente para lecturas de catálogo (productos, categorías, marcas)
    // Garantiza que un token de usuario caducado en localStorage jamás bloquee la carga de la tienda
    this.publicSupabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  /**
   * Si existe una sesión corrupta o caducada en localStorage sin refresh_token válido,
   * la limpia preventivamente para no provocar errores 401 (JWT expired) en PostgREST.
   */
  private cleanExpiredLocalSession(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const expiresAt = parsed?.expires_at;
            const refreshToken = parsed?.refresh_token;
            const nowSec = Math.floor(Date.now() / 1000);
            if (!refreshToken || (expiresAt && expiresAt < nowSec)) {
              keysToRemove.push(key);
            }
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  get publicClient(): SupabaseClient<Database> {
    return this.publicSupabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get from() {
    return this.supabase.from.bind(this.supabase);
  }

  /**
   * Acceso directo de lectura pública usando siempre la anon key sin interferencia de sesiones caducadas
   */
  get publicFrom() {
    return this.publicSupabase.from.bind(this.publicSupabase);
  }

  get storage() {
    return this.supabase.storage;
  }
}
