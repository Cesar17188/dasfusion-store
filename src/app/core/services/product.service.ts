import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, ProductFilter } from '../models/product.model';
import { SupabaseService } from './supabase.service';
import { DbProduct, DbProductVariant } from '../models/supabase.model';

export const ALL_PRODUCTS: Product[] = [
  // ==========================================
  // SMARTPHONES
  // ==========================================
  {
    id: 'phone_1',
    name: 'Apple iPhone 16 Pro Max 256GB Titanio Natural',
    slug: 'apple-iphone-16-pro-max',
    brand: 'Apple',
    category: 'Smartphones',
    subCategory: 'Gama Alta',
    description: 'Chip A18 Pro con GPU de 6 núcleos, botón de control de cámara táctil, grabación 4K a 120 fps en Dolby Vision y chasis de titanio de grado aeroespacial.',
    price: 1199.00,
    compareAtPrice: 1299.00,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80'],
    stock: 18,
    rating: 4.9,
    reviewCount: 95,
    isFeatured: true,
    isNew: true,
    variants: [
      { id: 'ip16pm_256', name: '256GB - Titanio Natural', sku: 'IP16PM-256-NAT', price: 1199.00, stock: 10, attributes: { storage: '256GB', color: 'Natural' } },
      { id: 'ip16pm_512', name: '512GB - Titanio Negro', sku: 'IP16PM-512-BLK', price: 1399.00, stock: 5, attributes: { storage: '512GB', color: 'Black' } },
      { id: 'ip16pm_1tb', name: '1TB - Titanio Desierto', sku: 'IP16PM-1TB-DES', price: 1599.00, stock: 3, attributes: { storage: '1TB', color: 'Desert' } }
    ],
    bundles: [
      {
        id: 'bun_ip16_magsafe',
        name: 'Pack Creador Móvil',
        description: 'iPhone 16 Pro Max + Cargador MagSafe 25W + Funda de Silicona Apple',
        price: 1279.00,
        originalPrice: 1350.00,
        items: [
          { productId: 'phone_1', name: 'iPhone 16 Pro Max', quantity: 1 },
          { productId: 'acc_magsafe', name: 'Cargador MagSafe', quantity: 1 }
        ]
      }
    ],
    specifications: [
      { category: 'Pantalla', specs: { 'Tipo': 'Super Retina XDR OLED 6.9"', 'Tasa de refresco': '120Hz ProMotion', 'Brillo': '2000 nits pico' } },
      { category: 'Rendimiento', specs: { 'Procesador': 'Apple A18 Pro (3nm)', 'RAM': '8GB', 'Batería': 'Hasta 33 horas de video' } },
      { category: 'Cámaras', specs: { 'Principal': '48MP Fusion con OIS', 'Ultra gran angular': '48MP', 'Teleobjetivo': '12MP 5x óptico' } }
    ],
    tags: ['Smartphone', 'Apple', 'iPhone', 'iOS', '5G']
  },
  {
    id: 'phone_2',
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray con Galaxy AI',
    slug: 'samsung-galaxy-s24-ultra',
    brand: 'Samsung',
    category: 'Smartphones',
    subCategory: 'Gama Alta',
    description: 'Equipado con Snapdragon 8 Gen 3 for Galaxy, marco de titanio, S-Pen integrado, pantalla Dynamic AMOLED 2X plana y funciones avanzadas de Galaxy AI.',
    price: 1299.99,
    compareAtPrice: 1419.99,
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80'],
    stock: 14,
    rating: 4.8,
    reviewCount: 76,
    isFeatured: true,
    isNew: false,
    variants: [
      { id: 's24u_256', name: '256GB - Titanium Gray', sku: 'S24U-256-GRY', price: 1149.99, stock: 6, attributes: { storage: '256GB', color: 'Gray' } },
      { id: 's24u_512', name: '512GB - Titanium Black', sku: 'S24U-512-BLK', price: 1299.99, stock: 8, attributes: { storage: '512GB', color: 'Black' } }
    ],
    specifications: [
      { category: 'Pantalla', specs: { 'Panel': '6.8" QHD+ Dynamic AMOLED 2X', 'Refresco': '1-120Hz Adaptativo', 'Cristal': 'Gorilla Armor antirreflejo' } },
      { category: 'Cámaras', specs: { 'Sensor Principal': '200MP OIS', 'Periscopio': '50MP 5x óptico', 'Ultra Wide': '12MP' } }
    ],
    tags: ['Smartphone', 'Samsung', 'Galaxy', 'Android', 'AI']
  },
  {
    id: 'phone_3',
    name: 'Google Pixel 9 Pro XL 128GB Obsidian con Google Tensor G4',
    slug: 'google-pixel-9-pro-xl',
    brand: 'Google',
    category: 'Smartphones',
    subCategory: 'Gama Alta',
    description: 'La experiencia pura de Android con Gemini Pro integrado, fotografía computacional líder en la industria y 7 años de actualizaciones del SO.',
    price: 1099.00,
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80'],
    stock: 9,
    rating: 4.8,
    reviewCount: 38,
    isNew: true,
    specifications: [
      { category: 'Hardware', specs: { 'Chip': 'Google Tensor G4 con chip de seguridad Titan M2', 'RAM': '16GB', 'Pantalla': '6.8" Super Actua LTPO 120Hz' } }
    ],
    tags: ['Smartphone', 'Google', 'Pixel', 'Gemini AI']
  },
  {
    id: 'phone_4',
    name: 'Xiaomi 14 Ultra 512GB con Óptica Leica Quad Camera',
    slug: 'xiaomi-14-ultra-leica',
    brand: 'Xiaomi',
    category: 'Smartphones',
    subCategory: 'Fotografía Móvil',
    description: 'Sensor principal Sony LYT-900 de 1 pulgada con apertura variable continua f/1.63 a f/4.0, lentes Leica Summilux y grabación 8K en todas las cámaras.',
    price: 1199.99,
    compareAtPrice: 1349.99,
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'],
    stock: 7,
    rating: 4.9,
    reviewCount: 29,
    isFeatured: true,
    specifications: [
      { category: 'Óptica', specs: { 'Sensor': 'Sony LYT-900 1"', 'Lentes': 'Leica Vario-Summilux', 'Cámaras': '4x 50MP' } }
    ],
    tags: ['Smartphone', 'Xiaomi', 'Leica', 'Cámara 1 pulgada']
  },
  {
    id: 'phone_5',
    name: 'Xiaomi Redmi Note 13 Pro+ 5G 256GB Midnight Black',
    slug: 'xiaomi-redmi-note-13-pro-plus',
    brand: 'Xiaomi',
    category: 'Smartphones',
    subCategory: 'Gama Media Premium',
    description: 'Cámara de 200MP con OIS, carga ultrarrápida HyperCharge de 120W, certificación IP68 y pantalla curva AMOLED de 1.5K a 120Hz.',
    price: 349.99,
    compareAtPrice: 399.99,
    images: ['https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=600&q=80'],
    stock: 25,
    rating: 4.7,
    reviewCount: 110,
    specifications: [
      { category: 'Especificaciones', specs: { 'Cámara': '200MP OIS', 'Carga': '120W (0-100% en 19 min)', 'Batería': '5000 mAh' } }
    ],
    tags: ['Smartphone', 'Xiaomi', 'Redmi', 'Calidad-Precio']
  },
  {
    id: 'phone_6',
    name: 'Samsung Galaxy A55 5G 128GB Awesome Navy',
    slug: 'samsung-galaxy-a55-5g',
    brand: 'Samsung',
    category: 'Smartphones',
    subCategory: 'Gama Media',
    description: 'Chasis de aluminio premium, cristal Gorilla Glass Victus+, procesador Exynos 1480 con GPU AMD Xclipse y 4 años de actualizaciones de Android.',
    price: 299.99,
    compareAtPrice: 350.00,
    images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'],
    stock: 30,
    rating: 4.6,
    reviewCount: 64,
    specifications: [
      { category: 'Pantalla & Construcción', specs: { 'Panel': '6.6" Super AMOLED 120Hz', 'Marco': 'Aluminio', 'Resistencia': 'IP67 agua y polvo' } }
    ],
    tags: ['Smartphone', 'Samsung', 'Gama Media']
  },

  // ==========================================
  // CÁMARAS PROFESIONALES Y CINEMA
  // ==========================================
  {
    id: 'cam_1',
    name: 'Sony Alpha 7 IV Cámara Mirrorless Full-Frame 33MP 4K 60p',
    slug: 'sony-alpha-7-iv-mirrorless',
    brand: 'Sony',
    category: 'Cámaras',
    subCategory: 'Mirrorless Full-Frame',
    description: 'El estándar de la industria híbrida. Sensor Exmor R de 33MP, enfoque automático en tiempo real con IA para humanos/animales/aves, 4K 60p en 10-bit 4:2:2 y perfil S-Cinetone.',
    price: 2298.00,
    compareAtPrice: 2499.00,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'],
    stock: 8,
    rating: 4.9,
    reviewCount: 53,
    isFeatured: true,
    isNew: false,
    variants: [
      { id: 'a7iv_body', name: 'Solo Cuerpo (Body)', sku: 'ILCE-7M4-B', price: 2298.00, stock: 5, attributes: { kit: 'Cuerpo Solo' } },
      { id: 'a7iv_kit2870', name: 'Kit con Lente 28-70mm OSS', sku: 'ILCE-7M4K', price: 2498.00, stock: 3, attributes: { kit: 'Kit 28-70mm' } }
    ],
    bundles: [
      {
        id: 'bun_a7iv_creator',
        name: 'Kit Producción Video Pro',
        description: 'Sony A7 IV + Micrófono Sony ECM-M1 + Tarjeta CFexpress Type A 160GB',
        price: 2699.00,
        originalPrice: 2950.00,
        items: [
          { productId: 'cam_1', name: 'Sony A7 IV', quantity: 1 },
          { productId: 'mic_sony', name: 'ECM-M1', quantity: 1 }
        ]
      }
    ],
    specifications: [
      { category: 'Sensor & Imagen', specs: { 'Sensor': '33MP Full-Frame Exmor R BSI CMOS', 'Procesador': 'BIONZ XR', 'Estabilización': '5 ejes IBIS (5.5 pasos)' } },
      { category: 'Video', specs: { 'Resolución': '4K 60p (Super 35), 4K 30p 7K oversampled', 'Color': '10-bit 4:2:2 All-Intra, S-Log3, S-Cinetone' } }
    ],
    tags: ['Cámara', 'Sony', 'Mirrorless', 'Full-Frame', 'Video 4K']
  },
  {
    id: 'cam_2',
    name: 'Canon EOS R5 Mark II Cámara Full-Frame 45MP 8K 60p RAW',
    slug: 'canon-eos-r5-mark-ii',
    brand: 'Canon',
    category: 'Cámaras',
    subCategory: 'Mirrorless Flagship',
    description: 'Sensor apilado retroiluminado de 45MP con procesador DIGIC Accelerator, Eye Control AF mejorado, video 8K 60p RAW interno y disparo continuo a 30 fps.',
    price: 4299.00,
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80'],
    stock: 4,
    rating: 5.0,
    reviewCount: 22,
    isFeatured: true,
    isNew: true,
    specifications: [
      { category: 'Sensor', specs: { 'Resolución': '45MP Stacked BSI Full-Frame', 'Video': '8K 60p RAW / 4K 120p', 'Autofoco': 'Dual Pixel Intelligent AF con IA' } }
    ],
    tags: ['Cámara', 'Canon', '8K', 'Mirrorless', 'Cinema']
  },
  {
    id: 'cam_3',
    name: 'Fujifilm X-T5 Mirrorless APS-C 40.2MP con Estilo Retro Black',
    slug: 'fujifilm-x-t5-black',
    brand: 'Fujifilm',
    category: 'Cámaras',
    subCategory: 'Mirrorless APS-C',
    description: 'Sensor X-Trans CMOS 5 HR de 40.2MP con simulación de películas legendarias de Fuji, diales analógicos dedicados, estabilizador IBIS de 7 pasos y video 6.2K.',
    price: 1699.00,
    compareAtPrice: 1799.00,
    images: ['https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80'],
    stock: 6,
    rating: 4.9,
    reviewCount: 45,
    specifications: [
      { category: 'Sensor & Formato', specs: { 'Sensor': '40.2MP X-Trans CMOS 5 HR', 'Simulación de Película': '20 modos incluidos Nostalgic Neg y Reala ACE' } }
    ],
    tags: ['Cámara', 'Fujifilm', 'Retro', 'Fotografía', 'APS-C']
  },
  {
    id: 'cam_4',
    name: 'Blackmagic Cinema Camera 6K Full Frame L-Mount',
    slug: 'blackmagic-cinema-camera-6k-full-frame',
    brand: 'Blackmagic Design',
    category: 'Cámaras',
    subCategory: 'Cámara de Cine Digital',
    description: 'Sensor Full-Frame 6048 x 4032 con 13 pasos de rango dinámico, montura L versátil, grabación Blackmagic RAW en tarjetas CFexpress Type B y pantalla táctil de 5 pulgadas.',
    price: 2595.00,
    images: ['https://images.unsplash.com/photo-1589872765582-7f7f98e7275d?auto=format&fit=crop&w=600&q=80'],
    stock: 5,
    rating: 4.9,
    reviewCount: 17,
    specifications: [
      { category: 'Cinema Specs', specs: { 'Sensor': 'Full-Frame 24x36mm 6K', 'Formato': 'Blackmagic RAW hasta 12-bit', 'Montura': 'Leica L-Mount' } }
    ],
    tags: ['Cámara', 'Blackmagic', 'Cine', 'RAW', '6K']
  },
  {
    id: 'cam_5',
    name: 'Canon EOS R50 Kit con Lente RF-S 18-45mm Creator Edition',
    slug: 'canon-eos-r50-creator-kit',
    brand: 'Canon',
    category: 'Cámaras',
    subCategory: 'Gama de Entrada / Vlogging',
    description: 'Cámara mirrorless compacta y ligera de 24.2MP con enfoque Dual Pixel CMOS AF II, video 4K 30p sin recorte sobremuestreado de 6K y pantalla táctil de ángulo variable.',
    price: 679.99,
    compareAtPrice: 749.99,
    images: ['https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=600&q=80'],
    stock: 14,
    rating: 4.7,
    reviewCount: 62,
    specifications: [
      { category: 'Especificaciones', specs: { 'Resolución': '24.2MP APS-C', 'Video': '4K 30p UHD / FHD 120p', 'Peso': 'Solo 375g' } }
    ],
    tags: ['Cámara', 'Canon', 'Vlog', 'Económica']
  },

  // ==========================================
  // LENTES Y ÓPTICA
  // ==========================================
  {
    id: 'lens_1',
    name: 'Sony FE 24-70mm f/2.8 GM II Lente Zoom Estándar G Master',
    slug: 'sony-fe-24-70mm-f28-gm-ii',
    brand: 'Sony',
    category: 'Lentes',
    subCategory: 'Zoom Estándar',
    description: 'El zoom f/2.8 más ligero y nítido de su clase. Cuatro motores lineales XD para un enfoque instantáneo, anillo de apertura con clic desactivable y óptica de resolución extrema.',
    price: 2298.00,
    images: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80'],
    stock: 11,
    rating: 5.0,
    reviewCount: 39,
    isFeatured: true,
    specifications: [
      { category: 'Óptica', specs: { 'Rango Focal': '24-70mm', 'Apertura Máxima': 'f/2.8 constante', 'Montura': 'Sony E-Mount Full Frame', 'Peso': '695g' } }
    ],
    tags: ['Lente', 'Sony', 'G Master', 'Zoom', 'f/2.8']
  },
  {
    id: 'lens_2',
    name: 'Sony FE 50mm f/1.2 GM Lente Prime de Apertura Ultrarrápida',
    slug: 'sony-fe-50mm-f12-gm',
    brand: 'Sony',
    category: 'Lentes',
    subCategory: 'Lente Prime / Fijo',
    description: 'Desenfoque bokeh sublime y nitidez impecable de esquina a esquina incluso a f/1.2. Tres elementos XA y diafragma circular de 11 hojas.',
    price: 1998.00,
    images: ['https://images.unsplash.com/photo-1582845512747-e42001c95638?auto=format&fit=crop&w=600&q=80'],
    stock: 6,
    rating: 5.0,
    reviewCount: 28,
    specifications: [
      { category: 'Óptica', specs: { 'Focal': '50mm', 'Apertura': 'f/1.2', 'Hojas de Diafragma': '11', 'Distancia mínima de enfoque': '40cm' } }
    ],
    tags: ['Lente', 'Sony', 'Prime', 'Bokeh', 'f/1.2']
  },
  {
    id: 'lens_3',
    name: 'Sigma 24-70mm f/2.8 DG DN II Art para Sony E / Leica L',
    slug: 'sigma-24-70mm-f28-art-ii',
    brand: 'Sigma',
    category: 'Lentes',
    subCategory: 'Zoom Estándar Art',
    description: 'La segunda generación del legendario zoom de Sigma. Más compacto, más rápido con motor HLA y nitidez a nivel de lentes prime a una fracción del costo.',
    price: 1199.00,
    compareAtPrice: 1299.00,
    images: ['https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=600&q=80'],
    stock: 16,
    rating: 4.9,
    reviewCount: 71,
    isFeatured: true,
    specifications: [
      { category: 'Óptica', specs: { 'Línea': 'Sigma Art Series', 'Apertura': 'f/2.8 constante', 'Motor': 'Lineal HLA' } }
    ],
    tags: ['Lente', 'Sigma', 'Art', 'Zoom', 'f/2.8']
  },
  {
    id: 'lens_4',
    name: 'Canon RF 70-200mm f/2.8 L IS USM Teleobjetivo Profesional',
    slug: 'canon-rf-70-200mm-f28-l-is',
    brand: 'Canon',
    category: 'Lentes',
    subCategory: 'Teleobjetivo Zoom',
    description: 'Diseño telescópico ultracompacto para la montura RF. Estabilizador de imagen de hasta 5 pasos (7.5 con IBIS) y sellado profesional contra polvo y salpicaduras.',
    price: 2799.00,
    images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'],
    stock: 5,
    rating: 4.9,
    reviewCount: 33,
    specifications: [
      { category: 'Óptica', specs: { 'Rango': '70-200mm', 'Apertura': 'f/2.8', 'Estabilización': 'IS 5 pasos', 'Montura': 'Canon RF' } }
    ],
    tags: ['Lente', 'Canon', 'Teleobjetivo', 'L Series']
  },
  {
    id: 'lens_5',
    name: 'Tamron 28-75mm f/2.8 Di III VXD G2 para Sony E-Mount',
    slug: 'tamron-28-75mm-f28-g2-sony',
    brand: 'Tamron',
    category: 'Lentes',
    subCategory: 'Zoom Ligero Calidad-Precio',
    description: 'El lente todoterreno más popular para creadores de contenido. Extremadamente ligero (540g), motor VXD supersilencioso y excelente nitidez óptica.',
    price: 799.00,
    compareAtPrice: 899.00,
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'],
    stock: 20,
    rating: 4.8,
    reviewCount: 84,
    specifications: [
      { category: 'Óptica', specs: { 'Focal': '28-75mm', 'Apertura': 'f/2.8', 'Peso': '540 gramos' } }
    ],
    tags: ['Lente', 'Tamron', 'Ligero', 'Economico']
  },

  // ==========================================
  // PERIFÉRICOS AUDIOVISUALES Y STREAMING
  // ==========================================
  {
    id: 'audio_1',
    name: 'Shure SM7B Micrófono Dinámico Vocal de Estudio Broadcast',
    slug: 'shure-sm7b-dynamic-microphone',
    brand: 'Shure',
    category: 'Audio & Periféricos',
    subCategory: 'Micrófonos de Estudio',
    description: 'El legendario estándar en podcasting, streaming y grabación vocal. Respuesta de frecuencia plana y uniforme con blindaje electromagnético contra interferencias.',
    price: 399.00,
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'],
    stock: 22,
    rating: 5.0,
    reviewCount: 140,
    isFeatured: true,
    specifications: [
      { category: 'Audio', specs: { 'Tipo': 'Dinámico (bobina móvil)', 'Patrón polar': 'Cardioide', 'Conexión': 'XLR 3-pin', 'Respuesta': '50 a 20,000 Hz' } }
    ],
    tags: ['Micrófono', 'Shure', 'XLR', 'Podcast', 'Streaming']
  },
  {
    id: 'audio_2',
    name: 'RØDE Wireless PRO Sistema Inalámbrico Dual de 32-bit Float',
    slug: 'rode-wireless-pro-dual-system',
    brand: 'RØDE',
    category: 'Audio & Periféricos',
    subCategory: 'Micrófonos Inalámbricos',
    description: 'Grabación interna de seguridad en 32-bit Float a prueba de distorsión, código de tiempo SMPTE integrado, alcance de 260m y estuche de carga inteligente incluido.',
    price: 399.00,
    images: ['https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=600&q=80'],
    stock: 15,
    rating: 4.9,
    reviewCount: 68,
    isFeatured: true,
    isNew: true,
    specifications: [
      { category: 'Audio', specs: { 'Grabación': '32-Bit Float On-Board (32GB memoria interna)', 'Alcance': '260 metros línea de visión', 'Autonomía': 'Hasta 21h con estuche' } }
    ],
    tags: ['Micrófono', 'Rode', 'Inalámbrico', 'Video', '32-bit']
  },
  {
    id: 'audio_3',
    name: 'RØDECaster Pro II Estudio de Producción de Audio Integrado',
    slug: 'rodecaster-pro-ii-audio-mixer',
    brand: 'RØDE',
    category: 'Audio & Periféricos',
    subCategory: 'Consolas e Interfaces de Audio',
    description: 'Preamplificadores Revolution de ruido ultrabajo (-131.5dBV EIN), procesamiento DSP APHEX integrado, pantalla táctil HD y conectividad dual USB-C para dos computadoras.',
    price: 699.00,
    images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80'],
    stock: 7,
    rating: 4.9,
    reviewCount: 41,
    specifications: [
      { category: 'Conectividad', specs: { 'Entradas': '4x Neutrik XLR/Jack combo', 'Preamps': 'Revolution Preamp +76dB ganancia', 'Procesador': 'DSP Quad-Core 1.5GHz' } }
    ],
    tags: ['Mixer', 'Rode', 'Podcast', 'Audio Interface']
  },
  {
    id: 'audio_4',
    name: 'Elgato Stream Deck + Controlador de Producción con Dials y Pantalla Táctil',
    slug: 'elgato-stream-deck-plus',
    brand: 'Elgato',
    category: 'Audio & Periféricos',
    subCategory: 'Controladores de Streaming',
    description: '8 teclas LCD totalmente personalizables, 4 diales de giro infinito multifunción y banda táctil LCD para control total de audio, iluminación y aplicaciones.',
    price: 199.99,
    images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80'],
    stock: 28,
    rating: 4.8,
    reviewCount: 92,
    isFeatured: true,
    specifications: [
      { category: 'Controles', specs: { 'Teclas': '8x LCD programables', 'Diales': '4x encoders analógicos con pulsador', 'Touch Strip': 'Pantalla táctil 108 x 14 mm' } }
    ],
    tags: ['Elgato', 'Stream Deck', 'Streaming', 'Control']
  },
  {
    id: 'audio_5',
    name: 'Sennheiser HD 660S2 Auriculares de Estudio Abiertos Hi-Fi',
    slug: 'sennheiser-hd-660s2-headphones',
    brand: 'Sennheiser',
    category: 'Audio & Periféricos',
    subCategory: 'Auriculares de Monitoreo',
    description: 'Respuesta de subgraves extendida y precisión analítica quirúrgica para masterización, mezcla y audiófilos exigentes. Transductores emparejados a mano (± 1 dB).',
    price: 499.95,
    compareAtPrice: 599.95,
    images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80'],
    stock: 12,
    rating: 4.9,
    reviewCount: 35,
    specifications: [
      { category: 'Audio', specs: { 'Impedancia': '300 Ohms', 'Respuesta': '8 Hz - 41,500 Hz', 'Diseño': 'Circumaural Abierto' } }
    ],
    tags: ['Auriculares', 'Sennheiser', 'Hi-Fi', 'Estudio']
  },
  {
    id: 'audio_6',
    name: 'Elgato 4K X Tarjeta Capturadora Externa HDMI 2.1 4K144 / 4K120',
    slug: 'elgato-4k-x-capture-card',
    brand: 'Elgato',
    category: 'Audio & Periféricos',
    subCategory: 'Capturadoras de Video',
    description: 'Captura hasta 4K a 144 fps o 1080p a 240 fps con pass-through HDMI 2.1 sin latencia y soporte VRR y HDR10 para PS5, Xbox Series X y PC Gaming.',
    price: 229.99,
    images: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'],
    stock: 18,
    rating: 4.8,
    reviewCount: 47,
    specifications: [
      { category: 'Video', specs: { 'Interface': 'USB 3.2 Gen 2 (10 Gbps)', 'Entrada/Salida': 'HDMI 2.1', 'Captura': 'Hasta 4K144 HDR' } }
    ],
    tags: ['Capturadora', 'Elgato', 'HDMI 2.1', '4K144', 'PS5']
  },

  // ==========================================
  // ILUMINACIÓN DE ESTUDIO Y CREADORES
  // ==========================================
  {
    id: 'light_1',
    name: 'Aputure Amaran 200x S Luz LED COB Bi-Color 200W Montura Bowens',
    slug: 'aputure-amaran-200x-s-cob-light',
    brand: 'Aputure',
    category: 'Iluminación',
    subCategory: 'Luz Continua COB',
    description: 'Fuente de luz puntual de 200W con chipset de espectro dual ultralimpio (SSI Tungsten 90, SSI D56 89), control por app Sidus Link, temperatura de 2700K a 6500K y montura Bowens estándar.',
    price: 349.00,
    compareAtPrice: 399.00,
    images: ['https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80'],
    stock: 14,
    rating: 4.9,
    reviewCount: 58,
    isFeatured: true,
    specifications: [
      { category: 'Iluminación', specs: { 'Potencia': '200W', 'Temperatura de Color': '2700K - 6500K Bi-Color', 'CRI / TLCI': '95+ / 98+', 'Control': 'Sidus Link Bluetooth App' } }
    ],
    tags: ['Iluminación', 'Aputure', 'Amaran', 'Estudio', 'COB']
  },
  {
    id: 'light_2',
    name: 'Nanlite PavoTube II 30C Tubo LED RGBWW de 120cm con Batería',
    slug: 'nanlite-pavotube-ii-30c-rgbww',
    brand: 'Nanlite',
    category: 'Iluminación',
    subCategory: 'Tubos LED RGB',
    description: 'Tubo de luz de píxeles RGBWW con batería integrada de 2.5 horas a máxima potencia, control de tono de 360°, efectos prácticos integrados y montura magnética.',
    price: 319.00,
    images: ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80'],
    stock: 19,
    rating: 4.9,
    reviewCount: 44,
    isFeatured: true,
    specifications: [
      { category: 'Iluminación', specs: { 'Longitud': '120 cm (4 pies)', 'Gama': 'RGBWW 2700K-7500K con ajuste G/M', 'Batería': 'Interna 14.8V/4400mAh Li-ion' } }
    ],
    tags: ['Iluminación', 'Nanlite', 'Tubo RGB', 'Efectos']
  },
  {
    id: 'light_3',
    name: 'Elgato Key Light MK.2 Panel LED de Estudio para Escritorio 2800 Lúmenes',
    slug: 'elgato-key-light-mk2',
    brand: 'Elgato',
    category: 'Iluminación',
    subCategory: 'Paneles para Creadores',
    description: 'Iluminación profesional para streaming con cristal opalino difuso multicapa antifatiga visual, 2800 lúmenes de potencia, control Wi-Fi desde PC/Mac/Stream Deck y brazo de escritorio acolchado.',
    price: 179.99,
    compareAtPrice: 199.99,
    images: ['https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80'],
    stock: 24,
    rating: 4.8,
    reviewCount: 115,
    specifications: [
      { category: 'Panel', specs: { 'Lúmenes': '2800 lm regulables', 'Temperatura': '2900K – 7000K', 'Conectividad': 'Wi-Fi 802.11 b/g/n' } }
    ],
    tags: ['Elgato', 'Key Light', 'Iluminación', 'Streaming']
  },
  {
    id: 'light_4',
    name: 'Godox SL60W Luz LED Continua para Video 5600K con Reflector',
    slug: 'godox-sl60w-continuous-light',
    brand: 'Godox',
    category: 'Iluminación',
    subCategory: 'Luz Continua Económica',
    description: 'La opción más recomendada y accesible para comenzar en producción de video y fotografía de producto. 60W de potencia pura balanceada a 5600K luz día con montura Bowens.',
    price: 119.00,
    compareAtPrice: 149.00,
    images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'],
    stock: 30,
    rating: 4.7,
    reviewCount: 98,
    specifications: [
      { category: 'Rendimiento', specs: { 'Potencia': '60W', 'Temperatura': '5600K ± 300K Daylight', 'Montura': 'Bowens S-Type' } }
    ],
    tags: ['Iluminación', 'Godox', 'Video', 'Economico']
  },
  {
    id: 'light_5',
    name: 'Neewer 18" Anillo de Luz LED RGB con Trípode y Soporte para Smartphone',
    slug: 'neewer-18-inch-rgb-ring-light',
    brand: 'Neewer',
    category: 'Iluminación',
    subCategory: 'Aros de Luz / Ring Lights',
    description: 'Aro de luz de 48cm con modos CCT/HSI/Escenas, control remoto inalámbrico, soporte flexible para cámara/móvil y bolsa de transporte incluida. Ideal para maquillaje y contenido vertical.',
    price: 89.99,
    compareAtPrice: 109.99,
    images: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'],
    stock: 22,
    rating: 4.6,
    reviewCount: 79,
    specifications: [
      { category: 'Diseño', specs: { 'Diámetro': '18 pulgadas (48 cm)', 'Potencia': '42W', 'Colores': '360° RGB + Blanco cálido/frío (2500K-8500K)' } }
    ],
    tags: ['Iluminación', 'Neewer', 'Ring Light', 'Tiktok', 'Reels']
  },

  // ==========================================
  // HARDWARE & COMPONENTES HIGH-END
  // ==========================================
  {
    id: 'hw_1',
    name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
    slug: 'nvidia-geforce-rtx-4080-super',
    brand: 'NVIDIA',
    category: 'Hardware & PC',
    subCategory: 'Tarjetas Gráficas',
    description: 'Rendimiento extremo para juegos 4K con Ray Tracing completo, DLSS 3.5 y flujos de trabajo con IA generativa.',
    price: 999.99,
    compareAtPrice: 1199.99,
    images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'],
    stock: 12,
    rating: 4.9,
    reviewCount: 42,
    isFeatured: true,
    isNew: true,
    variants: [
      { id: 'v1', name: 'Black Edition', sku: 'RTX4080S-BLK', price: 999.99, stock: 8, attributes: { color: 'Black' } },
      { id: 'v2', name: 'White OC Edition', sku: 'RTX4080S-WHT', price: 1049.99, stock: 4, attributes: { color: 'White' } }
    ],
    specifications: [
      { category: 'General', specs: { 'VRAM': '16GB GDDR6X', 'TDP': '320W', 'Bus': '256-bit' } }
    ],
    tags: ['GPU', 'RTX', 'Gaming', 'Hardware']
  },
  {
    id: 'hw_2',
    name: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread',
    slug: 'amd-ryzen-7-7800x3d',
    brand: 'AMD',
    category: 'Hardware & PC',
    subCategory: 'Procesadores',
    description: 'El procesador definitivo para gaming con tecnología 3D V-Cache.',
    price: 389.00,
    compareAtPrice: 449.00,
    images: ['https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80'],
    stock: 24,
    rating: 5.0,
    reviewCount: 88,
    isFeatured: true,
    specifications: [
      { category: 'Especificaciones', specs: { 'Socket': 'AM5', 'Cores': '8', 'Threads': '16', 'Base Clock': '4.2GHz' } }
    ],
    tags: ['CPU', 'AMD', 'Gaming', 'Hardware']
  },
  {
    id: 'hw_3',
    name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD',
    slug: 'samsung-990-pro-2tb-nvme',
    brand: 'Samsung',
    category: 'Hardware & PC',
    subCategory: 'Almacenamiento',
    description: 'Velocidades de lectura secuencial de hasta 7450 MB/s para tiempos de carga instantáneos.',
    price: 179.99,
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80'],
    stock: 40,
    rating: 4.9,
    reviewCount: 112,
    specifications: [
      { category: 'Storage', specs: { 'Interface': 'PCIe Gen 4.0 x4', 'Read Speed': '7450 MB/s', 'Form Factor': 'M.2 2280' } }
    ],
    tags: ['SSD', 'NVMe', 'Samsung', 'Hardware']
  }
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly productsSignal = signal<Product[]>(ALL_PRODUCTS);

  // Store only displays products where isActive !== false
  readonly products = computed(() => {
    return this.productsSignal().filter((p) => p.isActive !== false);
  });

  readonly categories = computed(() => {
    return Array.from(new Set(this.products().map((p) => p.category)));
  });

  readonly brands = computed(() => {
    return Array.from(new Set(this.products().map((p) => p.brand))).sort();
  });

  constructor() {
    this.loadProductsFromDatabase();
  }

  async loadProductsFromDatabase(): Promise<void> {
    try {
      const { data: prodData, error: prodErr } = await (this.supabaseService.from('products') as any).select('*');
      const { data: varData } = await (this.supabaseService.from('product_variants') as any).select('*');
      const { data: catData } = await (this.supabaseService.from('categories') as any).select('*');
      const { data: brandData } = await (this.supabaseService.from('brands') as any).select('*');

      if (!prodErr && prodData && prodData.length > 0) {
        const mapped: Product[] = (prodData as DbProduct[]).map((dbP) => {
          const cat = catData?.find((c: any) => c.id === dbP.category_id);
          const brand = brandData?.find((b: any) => b.id === dbP.brand_id);
          const vars = (varData || [])
            .filter((v: any) => v.product_id === dbP.id)
            .map((v: any) => ({
              id: v.id,
              name: v.variant_name,
              sku: v.sku,
              price: Number(v.price) || 0,
              stock: Number(v.stock) || 0,
              attributes: v.attributes || {}
            }));

          const minPrice = vars.length > 0 ? Math.min(...vars.map((v: any) => v.price)) : 0;
          const totalStock = vars.reduce((acc: number, v: any) => acc + v.stock, 0);

          return {
            id: dbP.id,
            name: dbP.model,
            slug: dbP.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || dbP.id,
            brand: brand?.name || 'Genérico',
            category: cat?.name || 'General',
            subCategory: cat?.parent_id ? cat.name : undefined,
            description: dbP.long_description || dbP.short_description || '',
            shortDescription: dbP.short_description || '',
            price: minPrice,
            images: Array.isArray(dbP.images) && dbP.images.length > 0 ? dbP.images : ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'],
            stock: totalStock,
            rating: 5.0,
            reviewCount: 1,
            isFeatured: true,
            isNew: true,
            specifications: Array.isArray(dbP.specifications) ? dbP.specifications : [],
            variants: vars,
            tags: [cat?.name, brand?.name, dbP.model].filter(Boolean) as string[],
            isActive: dbP.is_active !== false
          };
        });

        // Add mock products that don't collide with Supabase products
        const existingIds = new Set(mapped.map((p) => p.id));
        const existingSlugs = new Set(mapped.map((p) => p.slug));
        const combined = [...mapped];

        for (const sp of ALL_PRODUCTS) {
          if (!existingIds.has(sp.id) && !existingSlugs.has(sp.slug)) {
            combined.push(sp);
          }
        }

        this.productsSignal.set(combined);
      }
    } catch (err) {
      console.warn('Could not load products from Supabase, using mock products:', err);
    }
  }

  /**
   * Instantly toggles the product visibility in the storefront signal
   */
  setProductActive(productId: string, isActive: boolean): void {
    this.productsSignal.update((list) =>
      list.map((p) => {
        if (p.id === productId) {
          return { ...p, isActive };
        }
        return p;
      })
    );
  }

  getBrandsByCategory(category?: string): string[] {
    if (!category) {
      return this.brands();
    }
    const matchingProducts = this.products().filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    return Array.from(new Set(matchingProducts.map((p) => p.brand))).sort();
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.products().find((p) => p.slug === slug);
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  getRelatedProducts(product: Product, limit = 3): Product[] {
    return this.products()
      .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, limit);
  }

  filterProducts(filter: ProductFilter, searchQuery = ''): Product[] {
    const query = searchQuery.toLowerCase().trim();

    return this.products()
      .filter((product) => {
        if (filter.category && product.category !== filter.category) return false;
        if (filter.brand && filter.brand.length > 0 && !filter.brand.includes(product.brand)) return false;
        if (filter.minPrice !== undefined && product.price < filter.minPrice) return false;
        if (filter.maxPrice !== undefined && product.price > filter.maxPrice) return false;
        if (filter.inStock && product.stock <= 0) return false;
        if (query) {
          const inName = product.name.toLowerCase().includes(query);
          const inBrand = product.brand.toLowerCase().includes(query);
          const inCategory = product.category.toLowerCase().includes(query);
          const inTags = product.tags?.some((t) => t.toLowerCase().includes(query));
          if (!inName && !inBrand && !inCategory && !inTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'price-asc') return a.price - b.price;
        if (filter.sortBy === 'price-desc') return b.price - a.price;
        if (filter.sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }
}
