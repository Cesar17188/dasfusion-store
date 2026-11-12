import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';

export interface BrandViewItem {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  productCount: number;
  primaryLogoUrl: string;
  fallbackLogoUrl: string;
  initials: string;
}

/**
 * Mapeo de marcas tecnológicas, audiovisuales y de computación hacia su identificador
 * en Simple Icons CDN y su dominio oficial para resolución automática de logotipos.
 */
const BRAND_LOGO_DIRECTORY: Record<string, { simpleIcon?: string; domain: string; customLogoUrl?: string }> = {
  apple: { simpleIcon: 'apple', domain: 'apple.com' },
  sony: { simpleIcon: 'sony', domain: 'sony.com' },
  canon: { simpleIcon: 'canon', domain: 'usa.canon.com' },
  nikon: { simpleIcon: 'nikon', domain: 'nikon.com' },
  fujifilm: { simpleIcon: 'fujifilm', domain: 'fujifilm.com' },
  panasonic: { simpleIcon: 'panasonic', domain: 'panasonic.com' },
  lumix: { simpleIcon: 'panasonic', domain: 'panasonic.com' },
  blackmagic: { simpleIcon: 'blackmagicdesign', domain: 'blackmagicdesign.com' },
  'blackmagic design': { simpleIcon: 'blackmagicdesign', domain: 'blackmagicdesign.com' },
  dji: { simpleIcon: 'dji', domain: 'dji.com' },
  gopro: { simpleIcon: 'gopro', domain: 'gopro.com' },
  insta360: { simpleIcon: 'insta360', domain: 'insta360.com' },
  red: { domain: 'red.com' },
  arri: { domain: 'arri.com' },
  sigma: { domain: 'sigmaphoto.com' },
  tamron: { domain: 'tamron.com' },
  zeiss: { simpleIcon: 'zeiss', domain: 'zeiss.com' },
  samyang: { domain: 'samyanglens.com' },
  rokinon: { domain: 'rokinon.com' },
  viltrox: { domain: 'viltrox.com' },
  rode: { simpleIcon: 'rode', domain: 'rode.com' },
  'røde': { simpleIcon: 'rode', domain: 'rode.com' },
  shure: { simpleIcon: 'shure', domain: 'shure.com' },
  sennheiser: { simpleIcon: 'sennheiser', domain: 'sennheiser.com' },
  'audio-technica': { simpleIcon: 'audiotechnica', domain: 'audio-technica.com' },
  audiotechnica: { simpleIcon: 'audiotechnica', domain: 'audio-technica.com' },
  elgato: { simpleIcon: 'elgato', domain: 'elgato.com' },
  focusrite: { simpleIcon: 'focusrite', domain: 'focusrite.com' },
  zoom: { domain: 'zoomcorp.com' },
  tascam: { domain: 'tascam.com' },
  jbl: { simpleIcon: 'jbl', domain: 'jbl.com' },
  bose: { simpleIcon: 'bose', domain: 'bose.com' },
  yamaha: { simpleIcon: 'yamahacorporation', domain: 'yamaha.com' },
  behringer: { simpleIcon: 'behringer', domain: 'behringer.com' },
  godox: { domain: 'godox.com' },
  aputure: { domain: 'aputure.com' },
  amaran: { domain: 'aputure.com' },
  nanlite: { domain: 'nanlite.com' },
  neewer: { domain: 'neewer.com' },
  zhiyun: { domain: 'zhiyun-tech.com' },
  smallrig: { domain: 'smallrig.com' },
  manfrotto: { simpleIcon: 'manfrotto', domain: 'manfrotto.com' },
  tilta: { domain: 'tilta.com' },
  hollyland: { domain: 'hollyland.com' },
  asus: { simpleIcon: 'asus', domain: 'asus.com' },
  rog: { simpleIcon: 'republicofgamers', domain: 'rog.asus.com' },
  msi: { simpleIcon: 'msi', domain: 'msi.com' },
  gigabyte: { simpleIcon: 'gigabyte', domain: 'gigabyte.com' },
  aorus: { simpleIcon: 'gigabyte', domain: 'aorus.com' },
  asrock: { domain: 'asrock.com' },
  evga: { simpleIcon: 'evga', domain: 'evga.com' },
  zotac: { simpleIcon: 'zotac', domain: 'zotac.com' },
  pny: { domain: 'pny.com' },
  sapphire: { domain: 'sapphiretech.com' },
  intel: { simpleIcon: 'intel', domain: 'intel.com' },
  amd: { simpleIcon: 'amd', domain: 'amd.com' },
  nvidia: { simpleIcon: 'nvidia', domain: 'nvidia.com' },
  geforce: { simpleIcon: 'nvidia', domain: 'nvidia.com' },
  corsair: { simpleIcon: 'corsair', domain: 'corsair.com' },
  kingston: { simpleIcon: 'kingston', domain: 'kingston.com' },
  crucial: { simpleIcon: 'crucial', domain: 'crucial.com' },
  samsung: { simpleIcon: 'samsung', domain: 'samsung.com' },
  'western digital': { simpleIcon: 'westerndigital', domain: 'westerndigital.com' },
  wd: { simpleIcon: 'westerndigital', domain: 'westerndigital.com' },
  seagate: { simpleIcon: 'seagate', domain: 'seagate.com' },
  sandisk: { simpleIcon: 'sandisk', domain: 'sandisk.com' },
  lexar: { domain: 'lexar.com' },
  sabrent: { domain: 'sabrent.com' },
  adata: { simpleIcon: 'adata', domain: 'adata.com' },
  xpg: { domain: 'xpg.com' },
  teamgroup: { domain: 'teamgroupinc.com' },
  gskill: { domain: 'gskill.com' },
  'g.skill': { domain: 'gskill.com' },
  logitech: { simpleIcon: 'logitech', domain: 'logitech.com' },
  razer: { simpleIcon: 'razer', domain: 'razer.com' },
  hyperx: { simpleIcon: 'hyperx', domain: 'hyperx.com' },
  steelseries: { simpleIcon: 'steelseries', domain: 'steelseries.com' },
  'cooler master': { simpleIcon: 'coolermaster', domain: 'coolermaster.com' },
  coolermaster: { simpleIcon: 'coolermaster', domain: 'coolermaster.com' },
  nzxt: { simpleIcon: 'nzxt', domain: 'nzxt.com' },
  'lian li': { domain: 'lian-li.com' },
  lianli: { domain: 'lian-li.com' },
  thermaltake: { domain: 'thermaltake.com' },
  noctua: { domain: 'noctua.at' },
  deepcool: { domain: 'deepcool.com' },
  seasonic: { domain: 'seasonic.com' },
  'be quiet!': { domain: 'bequiet.com' },
  bequiet: { domain: 'bequiet.com' },
  dell: { simpleIcon: 'dell', domain: 'dell.com' },
  alienware: { simpleIcon: 'alienware', domain: 'alienware.com' },
  hp: { simpleIcon: 'hp', domain: 'hp.com' },
  omen: { simpleIcon: 'hp', domain: 'omen.com' },
  lenovo: { simpleIcon: 'lenovo', domain: 'lenovo.com' },
  acer: { simpleIcon: 'acer', domain: 'acer.com' },
  lg: { simpleIcon: 'lg', domain: 'lg.com' },
  benq: { simpleIcon: 'benq', domain: 'benq.com' },
  viewsonic: { domain: 'viewsonic.com' },
  aoc: { simpleIcon: 'aoc', domain: 'aoc.com' },
  xiaomi: { simpleIcon: 'xiaomi', domain: 'mi.com' },
  honor: { simpleIcon: 'honor', domain: 'honor.com' },
  motorola: { simpleIcon: 'motorola', domain: 'motorola.com' },
  google: { simpleIcon: 'google', domain: 'store.google.com' },
  huawei: { simpleIcon: 'huawei', domain: 'huawei.com' },
  oneplus: { simpleIcon: 'oneplus', domain: 'oneplus.com' },
  nothing: { simpleIcon: 'nothing', domain: 'nothing.tech' },
  realme: { domain: 'realme.com' },
  oppo: { simpleIcon: 'oppo', domain: 'oppo.com' },
  vivo: { simpleIcon: 'vivo', domain: 'vivo.com' },
  nintendo: { simpleIcon: 'nintendo', domain: 'nintendo.com' },
  playstation: { simpleIcon: 'playstation', domain: 'playstation.com' },
  xbox: { simpleIcon: 'xbox', domain: 'xbox.com' },
  valve: { simpleIcon: 'valve', domain: 'valvesoftware.com' },
  meta: { simpleIcon: 'meta', domain: 'meta.com' },
  anker: { simpleIcon: 'anker', domain: 'anker.com' },
  ugreen: { simpleIcon: 'ugreen', domain: 'ugreen.com' },
  baseus: { domain: 'baseus.com' },
  'tp-link': { simpleIcon: 'tplink', domain: 'tp-link.com' },
  tplink: { simpleIcon: 'tplink', domain: 'tp-link.com' },
  ubiquiti: { simpleIcon: 'ubiquiti', domain: 'ui.com' },
  mikrotik: { simpleIcon: 'mikrotik', domain: 'mikrotik.com' },
  epson: { simpleIcon: 'epson', domain: 'epson.com' },
  wacom: { simpleIcon: 'wacom', domain: 'wacom.com' },
  synology: { simpleIcon: 'synology', domain: 'synology.com' }
};

@Component({
  selector: 'app-brands-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './brands-list.component.html'
})
export class BrandsListComponent implements OnInit {
  readonly productService = inject(ProductService);

  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('');

  /**
   * Estado de carga del logotipo por ID de marca:
   * 0 = usando primaryLogoUrl (Simple Icons / Oficial)
   * 1 = usando fallbackLogoUrl (Favicon de alta resolución del dominio oficial)
   * 2 = usando monograma vectorial estilizado
   */
  readonly logoStageMap = signal<Record<string, number>>({});

  ngOnInit(): void {
    if (this.productService.products().length === 0 && !this.productService.isLoading()) {
      this.productService.loadProductsFromDatabase();
    }
  }

  readonly allBrands = computed<BrandViewItem[]>(() => {
    const dbBrands = this.productService.dbBrands();
    const dbCategories = this.productService.dbCategories();
    const products = this.productService.products();

    // Unificar marcas registradas en la tabla `brands` de la BD y marcas presentes en productos activos
    const brandMap = new Map<string, { id: string; name: string; slug: string; categoryIds: Set<string>; categoryNames: Set<string> }>();

    for (const b of dbBrands) {
      const key = b.name.trim().toLowerCase();
      if (!key) continue;
      const catIds = new Set<string>(
        Array.isArray(b.category_ids) && b.category_ids.length > 0
          ? b.category_ids
          : (b.category_id ? [b.category_id] : [])
      );
      const catNames = new Set<string>();
      catIds.forEach((cid) => {
        const foundCat = dbCategories.find((c) => c.id === cid);
        if (foundCat) catNames.add(foundCat.name);
      });

      brandMap.set(key, {
        id: b.id,
        name: b.name.trim(),
        slug: b.slug || key.replace(/[^a-z0-9]+/g, '-'),
        categoryIds: catIds,
        categoryNames: catNames
      });
    }

    for (const p of products) {
      const bName = (p.brand || '').trim();
      if (!bName || bName.toLowerCase() === 'genérico') continue;
      const key = bName.toLowerCase();
      const existing = brandMap.get(key);
      if (existing) {
        if (p.category) existing.categoryNames.add(p.category);
      } else {
        const catNames = new Set<string>();
        if (p.category) catNames.add(p.category);
        brandMap.set(key, {
          id: `prod-brand-${key}`,
          name: bName,
          slug: key.replace(/[^a-z0-9]+/g, '-'),
          categoryIds: new Set<string>(),
          categoryNames: catNames
        });
      }
    }

    const result: BrandViewItem[] = [];

    brandMap.forEach((entry) => {
      const count = products.filter((p) => p.brand.toLowerCase() === entry.name.toLowerCase()).length;
      const logos = this.resolveBrandLogos(entry.name, entry.slug);
      const words = entry.name.split(/\s+/).filter(Boolean);
      const initials =
        words.length >= 2
          ? (words[0][0] + words[1][0]).toUpperCase()
          : entry.name.slice(0, 2).toUpperCase();

      result.push({
        id: entry.id,
        name: entry.name,
        slug: entry.slug,
        categories: Array.from(entry.categoryNames).sort(),
        productCount: count,
        primaryLogoUrl: logos.primary,
        fallbackLogoUrl: logos.fallback,
        initials
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });

  readonly availableCategories = computed<string[]>(() => {
    const set = new Set<string>();
    this.allBrands().forEach((b) => b.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly filteredBrands = computed<BrandViewItem[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory().toLowerCase().trim();

    return this.allBrands().filter((brand) => {
      if (cat && !brand.categories.some((c) => c.toLowerCase() === cat)) {
        return false;
      }
      if (query) {
        const inName = brand.name.toLowerCase().includes(query);
        const inCats = brand.categories.some((c) => c.toLowerCase().includes(query));
        if (!inName && !inCats) return false;
      }
      return true;
    });
  });

  private resolveBrandLogos(name: string, slug: string): { primary: string; fallback: string } {
    const normalized = name.toLowerCase().trim();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const directoryMatch = BRAND_LOGO_DIRECTORY[normalized] || BRAND_LOGO_DIRECTORY[cleanSlug];

    const domain = directoryMatch?.domain || `${cleanSlug}.com`;
    const fallbackUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

    if (directoryMatch?.customLogoUrl) {
      return { primary: directoryMatch.customLogoUrl, fallback: fallbackUrl };
    }

    if (directoryMatch?.simpleIcon) {
      return {
        primary: `https://cdn.simpleicons.org/${directoryMatch.simpleIcon}/e3e2e6`,
        fallback: fallbackUrl
      };
    }

    // Para cualquier marca registrada en base de datos, intentar primero en Simple Icons y respaldar con el logotipo del dominio oficial
    return {
      primary: `https://cdn.simpleicons.org/${cleanSlug}/e3e2e6`,
      fallback: fallbackUrl
    };
  }

  getLogoStage(brandId: string): number {
    return this.logoStageMap()[brandId] ?? 0;
  }

  onLogoError(brandId: string): void {
    this.logoStageMap.update((prev) => {
      const current = prev[brandId] ?? 0;
      return { ...prev, [brandId]: current + 1 };
    });
  }

  selectCategory(category: string): void {
    if (!category || this.selectedCategory() === category) {
      this.selectedCategory.set('');
    } else {
      this.selectedCategory.set(category);
    }
  }
}

