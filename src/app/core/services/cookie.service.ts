import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CookieConsentPreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

const CONSENT_COOKIE_NAME = 'dasfusion_cookie_consent';
const CONSENT_STORAGE_KEY = 'dasfusion_cookie_consent';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _consent = signal<CookieConsentPreferences | null>(null);
  private readonly _showBanner = signal<boolean>(false);
  private readonly _showPreferences = signal<boolean>(false);

  readonly consent = this._consent.asReadonly();
  readonly showBanner = this._showBanner.asReadonly();
  readonly showPreferences = this._showPreferences.asReadonly();
  readonly hasConsented = computed(() => this._consent() !== null);

  constructor() {
    this.loadSavedConsent();
  }

  /**
   * Guarda una cookie directamente en el navegador del usuario
   */
  setCookie(name: string, value: string, days = 365, path = '/'): void {
    if (!this.isBrowser) return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=${path};SameSite=Lax`;
  }

  /**
   * Obtiene el valor de una cookie almacenada en el navegador
   */
  getCookie(name: string): string | null {
    if (!this.isBrowser) return null;

    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
    return null;
  }

  /**
   * Elimina una cookie del navegador
   */
  deleteCookie(name: string, path = '/'): void {
    if (!this.isBrowser) return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};SameSite=Lax`;
  }

  /**
   * Acepta todas las categorías de cookies y las guarda en el navegador
   */
  acceptAll(): void {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString()
    };
    this.applyAndPersistConsent(prefs);
  }

  /**
   * Acepta únicamente las cookies estrictamente necesarias
   */
  acceptNecessaryOnly(): void {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString()
    };
    this.applyAndPersistConsent(prefs);
  }

  /**
   * Guarda la selección personalizada del usuario
   */
  saveCustomPreferences(custom: Omit<CookieConsentPreferences, 'necessary' | 'updatedAt'>): void {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      preferences: custom.preferences,
      analytics: custom.analytics,
      marketing: custom.marketing,
      updatedAt: new Date().toISOString()
    };
    this.applyAndPersistConsent(prefs);
  }

  /**
   * Abre nuevamente el panel de configuración de cookies
   */
  openCookieSettings(): void {
    this._showBanner.set(true);
    this._showPreferences.set(true);
  }

  togglePreferencesPanel(): void {
    this._showPreferences.update((v) => !v);
  }

  private loadSavedConsent(): void {
    if (!this.isBrowser) return;

    const rawCookie = this.getCookie(CONSENT_COOKIE_NAME);
    const rawStorage = localStorage.getItem(CONSENT_STORAGE_KEY);
    const raw = rawCookie || rawStorage;

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CookieConsentPreferences;
        this._consent.set(parsed);
        this._showBanner.set(false);
        // Asegura que la cookie esté sincronizada en el navegador
        if (!rawCookie) {
          this.setCookie(CONSENT_COOKIE_NAME, JSON.stringify(parsed), 365);
        }
        return;
      } catch {
        // Si el JSON está corrupto, mostrar nuevamente el banner
      }
    }

    this._showBanner.set(true);
  }

  private applyAndPersistConsent(prefs: CookieConsentPreferences): void {
    this._consent.set(prefs);
    this._showBanner.set(false);
    this._showPreferences.set(false);

    if (!this.isBrowser) return;

    const serialized = JSON.stringify(prefs);
    this.setCookie(CONSENT_COOKIE_NAME, serialized, 365);
    localStorage.setItem(CONSENT_STORAGE_KEY, serialized);

    // Guardar cookies individuales en el navegador según las preferencias aceptadas
    this.setCookie('dasfusion_session_active', 'true', 30);

    if (prefs.preferences) {
      this.setCookie('dasfusion_ui_theme', 'dark-tech', 365);
      this.setCookie('dasfusion_store_region', 'EC', 365);
    } else {
      this.deleteCookie('dasfusion_ui_theme');
      this.deleteCookie('dasfusion_store_region');
    }

    if (prefs.analytics) {
      this.setCookie('dasfusion_analytics_enabled', '1', 365);
    } else {
      this.deleteCookie('dasfusion_analytics_enabled');
    }

    if (prefs.marketing) {
      this.setCookie('dasfusion_marketing_enabled', '1', 180);
    } else {
      this.deleteCookie('dasfusion_marketing_enabled');
    }
  }
}

