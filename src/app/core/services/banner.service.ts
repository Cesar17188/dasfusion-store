import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const STORAGE_KEY = 'das_promo_banners_v1';

export const DEFAULT_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'default-banner-1',
    title: 'Temporada Gaming & Estaciones de Trabajo Pro',
    subtitle: 'Potencia extrema con procesadores de última generación, refrigeración líquida y gráficas de alto rendimiento',
    image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1600&q=85',
    link_url: '/',
    display_order: 1,
    is_active: true,
    created_at: '2026-11-11T00:00:00.000Z'
  },
  {
    id: 'default-banner-2',
    title: 'Especial Producción Audiovisual & Broadcast 4K',
    subtitle: 'Cámaras mirrorless, óptica profesional, micrófonos de estudio e iluminación RGB para creadores en Ecuador',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=85',
    link_url: '/',
    display_order: 2,
    is_active: true,
    created_at: '2026-11-11T00:01:00.000Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private readonly supabase = inject(SupabaseService);

  readonly banners = signal<PromoBanner[]>(this.loadFromLocalStorage());
  readonly isLoading = signal<boolean>(false);

  constructor() {
    this.loadBanners();
  }

  private loadFromLocalStorage(): PromoBanner[] {
    if (typeof window === 'undefined') {
      return [...DEFAULT_PROMO_BANNERS];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    this.saveToLocalStorage(DEFAULT_PROMO_BANNERS);
    return [...DEFAULT_PROMO_BANNERS];
  }

  private saveToLocalStorage(list: PromoBanner[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  async loadBanners(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data, error } = await (this.supabase.from('promo_banners' as any) as any)
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          this.banners.set(data as PromoBanner[]);
          this.saveToLocalStorage(data as PromoBanner[]);
        } else {
          // Si la tabla existe pero está vacía y no se ha inicializado en local, usar el estado actual
          const local = this.loadFromLocalStorage();
          this.banners.set(local);
        }
      }
    } catch {
      // Fallback silencioso a los banners locales / por defecto
    } finally {
      this.isLoading.set(false);
    }
  }

  async uploadBannerImageFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `banners/banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    try {
      const { error: uploadError } = await this.supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data } = this.supabase.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      }
    } catch {}

    // Fallback a Data URL Base64 para garantizar carga inmediata
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async addBanner(payload: {
    image_url: string;
    title?: string;
    subtitle?: string;
    link_url?: string;
  }): Promise<PromoBanner> {
    const current = this.banners();
    const nextOrder = current.length > 0 ? Math.max(...current.map((b) => b.display_order || 0)) + 1 : 1;

    const newBanner: PromoBanner = {
      id: crypto.randomUUID(),
      title: (payload.title || '').trim(),
      subtitle: (payload.subtitle || '').trim() || null,
      image_url: payload.image_url.trim(),
      link_url: (payload.link_url || '').trim() || '/',
      display_order: nextOrder,
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await (this.supabase.from('promo_banners' as any) as any)
        .insert({
          id: newBanner.id,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          image_url: newBanner.image_url,
          link_url: newBanner.link_url,
          display_order: newBanner.display_order,
          is_active: newBanner.is_active
        })
        .select()
        .single();

      if (!error && data) {
        const updated = [...this.banners(), data as PromoBanner];
        this.banners.set(updated);
        this.saveToLocalStorage(updated);
        return data as PromoBanner;
      }
    } catch {}

    const updated = [...this.banners(), newBanner];
    this.banners.set(updated);
    this.saveToLocalStorage(updated);
    return newBanner;
  }

  async updateBannerLink(bannerId: string, linkUrl: string): Promise<void> {
    const normalizedLink = (linkUrl || '').trim() || '/';
    try {
      await (this.supabase.from('promo_banners' as any) as any)
        .update({ link_url: normalizedLink })
        .eq('id', bannerId);
    } catch {}

    const updated = this.banners().map((b) =>
      b.id === bannerId ? { ...b, link_url: normalizedLink } : b
    );
    this.banners.set(updated);
    this.saveToLocalStorage(updated);
  }

  async removeBanner(bannerId: string): Promise<void> {
    try {
      await (this.supabase.from('promo_banners' as any) as any).delete().eq('id', bannerId);
    } catch {}

    const updated = this.banners().filter((b) => b.id !== bannerId);
    this.banners.set(updated);
    this.saveToLocalStorage(updated);
  }

  async resetDefaultBanners(): Promise<void> {
    this.banners.set([...DEFAULT_PROMO_BANNERS]);
    this.saveToLocalStorage(DEFAULT_PROMO_BANNERS);
  }
}

