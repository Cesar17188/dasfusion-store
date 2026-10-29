import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Product } from '../models/product.model';
import { PAYMENT_WHATSAPP_PHONE } from '../constants/bank-accounts.constant';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  robots?: string;
  priceAmount?: number;
  priceCurrency?: string;
  availability?: 'in stock' | 'out of stock';
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Representa una Tripleta Semántica explícita (Sujeto -> Predicado -> Objeto)
 * para optimización de Grafos de Conocimiento (SEO Semántico y AEO).
 */
export interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  readonly siteName = 'DASFUSION Store';
  readonly baseUrl = 'https://dasfusion.ec';
  readonly defaultImage = 'https://dasfusion.ec/favicon.ico';

  /**
   * Tripletas Semánticas centrales (Sujeto -> Predicado -> Objeto)
   * estructuradas para extracción directa por buscadores y motores de respuesta (LLMs).
   */
  readonly storeSemanticTriples: SemanticTriple[] = [
    {
      subject: 'DASFUSION Store',
      predicate: 'comercializa',
      object: 'Hardware de alto rendimiento, componentes de PC, cámaras profesionales y smartphones en Ecuador'
    },
    {
      subject: 'DASFUSION Store',
      predicate: 'está ubicada en',
      object: 'Bélgica y Eloy Alfaro, Quito, Pichincha, Ecuador'
    },
    {
      subject: 'DASFUSION Store',
      predicate: 'atiende en horario de',
      object: 'Lunes a Viernes, con cita previa'
    },
    {
      subject: 'DASFUSION Store',
      predicate: 'ofrece contacto directo vía',
      object: 'WhatsApp 0987148786 (+593 98 714 8786) y correo ventas@dasfusion.ec'
    },
    {
      subject: 'DASFUSION Store',
      predicate: 'otorga garantía directa de',
      object: '12 meses en todos los componentes y equipos tecnológicos'
    },
    {
      subject: 'PC Builder Pro de DASFUSION',
      predicate: 'verifica la compatibilidad entre',
      object: 'Procesadores (CPU), Placas Base (Motherboard), Memorias RAM DDR4/DDR5, Tarjetas Gráficas (GPU), SSD NVMe y Fuentes 80+'
    }
  ];

  readonly storeFaqs: FaqItem[] = [
    {
      question: '¿Dónde está ubicada la tienda DASFUSION Store y cuál es su horario de atención?',
      answer:
        'DASFUSION Store está ubicada en Bélgica y Eloy Alfaro (Quito, Ecuador). DASFUSION Store atiende de Lunes a Viernes, con cita previa. Los clientes agendan su cita o consultan disponibilidad por WhatsApp al 0987148786 o al correo ventas@dasfusion.ec.'
    },
    {
      question: '¿Qué garantía tienen los productos de hardware y tecnología en DASFUSION Store?',
      answer:
        'DASFUSION Store ofrece garantía directa de 12 meses contra defectos de fábrica en todos sus componentes de hardware, cámaras, smartphones, audio profesional y computadoras.'
    },
    {
      question: '¿Realizan envíos a todo el Ecuador?',
      answer:
        'DASFUSION Store realiza envíos asegurados a todas las provincias del Ecuador (Quito, Guayaquil, Cuenca, Ambato, Manta, Loja y Galápagos). Los pedidos que superan el monto mínimo incluyen envío gratuito.'
    },
    {
      question: '¿Cómo funciona el configurador PC Builder Pro de DASFUSION?',
      answer:
        'PC Builder Pro valida automáticamente la compatibilidad técnica entre procesador (CPU), placa base (Motherboard), memoria RAM DDR4/DDR5, tarjeta gráfica (GPU), almacenamiento NVMe, fuente de poder (PSU), gabinete y sistema de refrigeración.'
    },
    {
      question: '¿Qué métodos de pago acepta DASFUSION Store?',
      answer:
        'DASFUSION Store acepta transferencia bancaria directa (Banco Internacional, Banco Guayaquil / Peigo, Produbanco y Banco General Rumiñahui - BGR) y tarjetas de crédito o débito. Además, la plataforma genera proformas comerciales en PDF con validez de 15 días.'
    }
  ];

  updateSeo(config: SeoConfig): void {
    const fullTitle = config.title.includes(this.siteName)
      ? config.title
      : `${config.title} | ${this.siteName}`;
    const canonicalUrl = config.url ? `${this.baseUrl}${config.url}` : this.baseUrl;
    const imageUrl = config.image || this.defaultImage;
    const type = config.type || 'website';
    const robots =
      config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    this.titleService.setTitle(fullTitle);

    this.metaService.updateTag({ name: 'description', content: config.description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }
    this.metaService.updateTag({ name: 'robots', content: robots });
    this.metaService.updateTag({ name: 'author', content: 'DASFUSION Store Ecuador' });

    // Open Graph
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:locale', content: 'es_EC' });
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:type', content: type });
    this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });

    // Product specific Open Graph tags
    if (type === 'product' && config.priceAmount !== undefined) {
      this.metaService.updateTag({
        property: 'product:price:amount',
        content: config.priceAmount.toFixed(2)
      });
      this.metaService.updateTag({
        property: 'product:price:currency',
        content: config.priceCurrency || 'USD'
      });
      if (config.availability) {
        this.metaService.updateTag({
          property: 'product:availability',
          content: config.availability
        });
      }
    }

    // Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });

    this.setCanonicalUrl(canonicalUrl);
  }

  /**
   * Genera tripletas semánticas dinámicas para un producto específico (Sujeto -> Predicado -> Objeto)
   */
  getProductSemanticTriples(product: Product, finalPriceWithTax: number): SemanticTriple[] {
    return [
      {
        subject: product.name,
        predicate: 'es fabricado por la marca',
        object: product.brand
      },
      {
        subject: product.name,
        predicate: 'pertenece a la categoría',
        object: product.subCategory ? `${product.category} (${product.subCategory})` : product.category
      },
      {
        subject: product.name,
        predicate: 'es comercializado en Ecuador por',
        object: 'DASFUSION Store con garantía directa de 12 meses'
      },
      {
        subject: product.name,
        predicate: 'tiene un precio con IVA incluido de',
        object: `$${finalPriceWithTax.toFixed(2)} USD (${product.stock > 0 ? 'Disponible en stock' : 'Agotado temporalmente'})`
      }
    ];
  }

  /**
   * Configura SEO y AEO (JSON-LD) para la página de catálogo principal
   */
  setCatalogSeo(products: Product[], selectedCategory?: string): void {
    const title = selectedCategory
      ? `${selectedCategory} en Ecuador - Catálogo Oficial`
      : 'Hardware High-End, Cámaras, Smartphones & PC Builder en Ecuador';
    const description = selectedCategory
      ? `DASFUSION Store comercializa ${selectedCategory} en Ecuador con garantía directa de 12 meses, envíos asegurados a todo el país y atención en Bélgica y Eloy Alfaro, Quito.`
      : 'DASFUSION Store comercializa hardware de alto rendimiento, componentes de PC, cámaras profesionales, smartphones, audio broadcast y el configurador PC Builder Pro en Quito y todo el Ecuador.';

    this.updateSeo({
      title,
      description,
      keywords:
        'hardware ecuador, tienda de tecnologia quito, componentes pc ecuador, pc builder ecuador, procesadores ryzen intel, tarjetas graficas rtx, camaras profesionales, dasfusion store',
      url: '/catalog',
      type: 'website'
    });

    const itemListElements = products.slice(0, 12).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        description: p.shortDescription || p.description,
        image: p.images?.[0] || this.defaultImage,
        brand: {
          '@type': 'Brand',
          name: p.brand || 'DASFUSION'
        },
        sku: p.variants?.[0]?.sku || p.id,
        url: `${this.baseUrl}/catalog/${p.slug}`,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: p.price.toFixed(2),
          availability:
            p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            '@id': `${this.baseUrl}/#organization`,
            name: this.siteName
          }
        }
      }
    }));

    this.setJsonLd('seo-dynamic-ld', {
      '@context': 'https://schema.org',
      '@graph': [
        this.getStoreOrganizationSchema(),
        {
          '@type': 'CollectionPage',
          '@id': `${this.baseUrl}/catalog#collection`,
          url: `${this.baseUrl}/catalog`,
          name: title,
          description,
          isPartOf: { '@id': `${this.baseUrl}/#website` },
          about: { '@id': `${this.baseUrl}/#organization` },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: itemListElements.length,
            itemListElement: itemListElements
          }
        },
        this.getFaqSchema()
      ]
    });
  }

  /**
   * Configura SEO y AEO (Product + Offer + BreadcrumbList JSON-LD) para la ficha de producto
   */
  setProductSeo(product: Product, finalPriceWithTax: number): void {
    const title = `${product.name} (${product.brand}) - Comprar en Ecuador`;
    const description =
      product.shortDescription ||
      product.description ||
      `DASFUSION Store ofrece ${product.name} de la marca ${product.brand} con garantía directa de 12 meses y envío asegurado a todo el Ecuador.`;

    this.updateSeo({
      title,
      description,
      keywords: `${product.name}, ${product.brand}, ${product.category}, ${(product.tags || []).join(', ')}, comprar en ecuador, dasfusion store`,
      url: `/catalog/${product.slug}`,
      image: product.images?.[0] || this.defaultImage,
      type: 'product',
      priceAmount: finalPriceWithTax,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'in stock' : 'out of stock'
    });

    const additionalProperties = (product.specifications || []).flatMap((group) =>
      Object.entries(group.specs || {}).map(([key, val]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: String(val)
      }))
    );

    const productSchema: Record<string, unknown> = {
      '@type': 'Product',
      '@id': `${this.baseUrl}/catalog/${product.slug}#product`,
      name: product.name,
      description: product.description || description,
      sku: product.variants?.[0]?.sku || product.id,
      image: product.images || [this.defaultImage],
      category: product.category,
      brand: {
        '@type': 'Brand',
        name: product.brand || 'DASFUSION'
      },
      additionalProperty: additionalProperties,
      offers: {
        '@type': 'Offer',
        url: `${this.baseUrl}/catalog/${product.slug}`,
        priceCurrency: 'USD',
        price: finalPriceWithTax.toFixed(2),
        itemCondition: 'https://schema.org/NewCondition',
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          '@id': `${this.baseUrl}/#organization`,
          name: this.siteName
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'EC'
          }
        }
      }
    };

    if (product.rating && product.reviewCount > 0) {
      productSchema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    this.setJsonLd('seo-dynamic-ld', {
      '@context': 'https://schema.org',
      '@graph': [
        this.getStoreOrganizationSchema(),
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Catálogo',
              item: `${this.baseUrl}/catalog`
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: product.category,
              item: `${this.baseUrl}/catalog`
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: product.name,
              item: `${this.baseUrl}/catalog/${product.slug}`
            }
          ]
        },
        productSchema
      ]
    });
  }

  /**
   * Configura SEO y AEO para la herramienta PC Builder Pro
   */
  setPcBuilderSeo(): void {
    const title = 'PC Builder Pro | Configurador de PC Gamer, Workstation & IA en Ecuador';
    const description =
      'PC Builder Pro de DASFUSION Store valida la compatibilidad en tiempo real entre procesador (CPU), placa madre, memoria DDR5, tarjeta gráfica RTX, SSD NVMe y fuente 80+ en Ecuador.';

    this.updateSeo({
      title,
      description,
      keywords:
        'pc builder ecuador, armar pc gamer quito, configurador de pc, compatibilidad hardware, workstation ia ecuador, dasfusion store',
      url: '/pc-builder',
      type: 'website'
    });

    this.setJsonLd('seo-dynamic-ld', {
      '@context': 'https://schema.org',
      '@graph': [
        this.getStoreOrganizationSchema(),
        {
          '@type': 'WebApplication',
          '@id': `${this.baseUrl}/pc-builder#app`,
          name: 'DASFUSION PC Builder Pro',
          url: `${this.baseUrl}/pc-builder`,
          applicationCategory: 'ShoppingApplication',
          operatingSystem: 'All',
          provider: { '@id': `${this.baseUrl}/#organization` },
          description,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        },
        this.getFaqSchema()
      ]
    });
  }

  private getStoreOrganizationSchema(): Record<string, unknown> {
    return {
      '@type': 'ComputerStore',
      '@id': `${this.baseUrl}/#organization`,
      name: this.siteName,
      url: this.baseUrl,
      telephone: `+${PAYMENT_WHATSAPP_PHONE}`,
      email: 'ventas@dasfusion.ec',
      priceRange: '$$',
      currenciesAccepted: 'USD',
      paymentAccepted: 'Transferencia Bancaria, Tarjeta de Crédito, Tarjeta de Débito',
      areaServed: {
        '@type': 'Country',
        name: 'Ecuador'
      },
      knowsAbout: [
        'Hardware de Alto Rendimiento',
        'Procesadores AMD Ryzen e Intel Core',
        'Tarjetas Gráficas NVIDIA GeForce RTX y AMD Radeon',
        'Placas Base AM5 y LGA1700',
        'Memorias RAM DDR5 y Almacenamiento SSD NVMe Gen4/Gen5',
        'Estaciones de Trabajo para Inteligencia Artificial',
        'Cámaras Profesionales y Equipos de Audio Broadcast'
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Catálogo Oficial DASFUSION Store',
        itemListElement: [
          { '@type': 'OfferCatalog', name: 'Procesadores & Tarjetas Gráficas' },
          { '@type': 'OfferCatalog', name: 'Placas Base & Memorias DDR5' },
          { '@type': 'OfferCatalog', name: 'Almacenamiento SSD / NVMe Gen4' },
          { '@type': 'OfferCatalog', name: 'Fuentes 80+ & Gabinetes' },
          { '@type': 'OfferCatalog', name: 'Cámaras, Smartphones & Audio Pro' }
        ]
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bélgica y Eloy Alfaro',
        addressLocality: 'Quito',
        addressRegion: 'Pichincha',
        addressCountry: 'EC'
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          description: 'Horario de atención de Lunes a Viernes, con cita previa'
        }
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: `+${PAYMENT_WHATSAPP_PHONE}`,
          contactType: 'sales',
          email: 'ventas@dasfusion.ec',
          areaServed: 'EC',
          availableLanguage: ['Spanish']
        }
      ]
    };
  }

  private getFaqSchema(): Record<string, unknown> {
    return {
      '@type': 'FAQPage',
      '@id': `${this.baseUrl}/#faq`,
      mainEntity: this.storeFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  private setCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(scriptId: string, data: Record<string, unknown>): void {
    let script = this.doc.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
