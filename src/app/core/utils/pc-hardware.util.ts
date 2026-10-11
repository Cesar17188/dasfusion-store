import { Product } from '../models/product.model';
import { ComponentCategory, SelectedComponent } from '../models/pc-builder.model';

/**
 * Searches product.specifications for a specific key
 */
export function getSpecValue(product: Product, keyName: string): string | null {
  const targetKey = keyName.toLowerCase();
  for (const group of product.specifications || []) {
    for (const [key, val] of Object.entries(group.specs || {})) {
      if (key.toLowerCase().includes(targetKey)) {
        return String(val).trim();
      }
    }
  }
  return null;
}

/**
 * Detects the CPU socket (e.g. AM5, AM4, LGA1700, LGA1851, LGA1200)
 */
export function detectCpuSocket(product: Product): string | null {
  const fromSpec = getSpecValue(product, 'socket');
  if (fromSpec) return fromSpec.toUpperCase().replace(/\s+/g, '');

  const text = `${product.name} ${product.description || ''} ${(product.tags || []).join(' ')}`.toUpperCase();

  if (text.includes('AM5') || /RYZEN\s*[3579]?\s*[789]\d{3}/i.test(text) || /\b[789]\d{3}[A-Z0-9]*\b/i.test(text) && text.includes('RYZEN')) {
    return 'AM5';
  }
  if (text.includes('AM4') || /RYZEN\s*[3579]?\s*[12345]\d{3}/i.test(text) || /\b[12345]\d{3}[A-Z0-9]*\b/i.test(text) && text.includes('RYZEN')) {
    return 'AM4';
  }
  if (/CORE\s+ULTRA/i.test(text) || /\b2\d{2}[A-Z]*\b/i.test(text) && text.includes('ULTRA')) {
    return 'LGA1851';
  }
  if (
    /\b1[234]\d{3}[A-Z]*\b/i.test(text) ||
    text.includes('12400') ||
    text.includes('14400') ||
    text.includes('14700') ||
    text.includes('14900') ||
    text.includes('14100') ||
    text.includes('12100') ||
    text.includes('12700') ||
    text.includes('12900') ||
    text.includes('13400') ||
    text.includes('13700') ||
    text.includes('13900')
  ) {
    return 'LGA1700';
  }
  if (/\b1[01]\d{3}[A-Z]*\b/i.test(text) || text.includes('10400') || text.includes('10700') || text.includes('11400')) {
    return 'LGA1200';
  }
  return null;
}

/**
 * Detects the Motherboard socket
 */
export function detectMotherboardSocket(product: Product): string | null {
  const fromSpec = getSpecValue(product, 'socket');
  if (fromSpec) return fromSpec.toUpperCase().replace(/\s+/g, '');

  const text = `${product.name} ${product.description || ''} ${(product.tags || []).join(' ')}`.toUpperCase();

  if (/A520|B450|B550|X570/i.test(text)) return 'AM4';
  if (/A620|B650|X670|X870|B850/i.test(text)) return 'AM5';
  if (/H610|B660|B760|Q670|H670|H770|Z690|Z790/i.test(text) || text.includes('B76')) return 'LGA1700';
  if (/B860|Z890|H810|B840/i.test(text) || text.includes('B85M') || text.includes('B86') || text.includes('Z89')) return 'LGA1851';
  if (/H410|B460|H510|B560|Z490|Z590/i.test(text)) return 'LGA1200';
  if (text.includes('AM5')) return 'AM5';
  if (text.includes('AM4')) return 'AM4';
  if (text.includes('LGA1700') || text.includes('1700')) return 'LGA1700';
  if (text.includes('LGA1851') || text.includes('1851')) return 'LGA1851';
  return null;
}

/**
 * Detects whether the Motherboard uses DDR4 or DDR5
 */
export function detectMotherboardRamType(product: Product): 'DDR4' | 'DDR5' | null {
  const fromSpec = getSpecValue(product, 'memoria') || getSpecValue(product, 'ram');
  if (fromSpec) {
    if (fromSpec.toUpperCase().includes('DDR5')) return 'DDR5';
    if (fromSpec.toUpperCase().includes('DDR4')) return 'DDR4';
  }

  const text = `${product.name} ${product.description || ''}`.toUpperCase();
  if (text.includes('DDR4')) return 'DDR4';
  if (text.includes('DDR5')) return 'DDR5';

  const sock = detectMotherboardSocket(product);
  if (sock === 'AM5' || sock === 'LGA1851') return 'DDR5';
  if (sock === 'AM4' || sock === 'LGA1200') return 'DDR4';

  return 'DDR5';
}

/**
 * Detects RAM memory generation (DDR4 vs DDR5)
 */
export function detectRamType(product: Product): 'DDR4' | 'DDR5' | null {
  const fromSpec = getSpecValue(product, 'tipo') || getSpecValue(product, 'memoria');
  if (fromSpec) {
    if (fromSpec.toUpperCase().includes('DDR5')) return 'DDR5';
    if (fromSpec.toUpperCase().includes('DDR4')) return 'DDR4';
  }

  const text = `${product.name} ${product.description || ''} ${(product.tags || []).join(' ')}`.toUpperCase();
  if (text.includes('DDR5')) return 'DDR5';
  if (text.includes('DDR4')) return 'DDR4';
  return null;
}

/**
 * Detects PSU rated wattage
 */
export function detectPsuWattage(product: Product): number | null {
  const fromSpec = getSpecValue(product, 'potencia') || getSpecValue(product, 'watt');
  if (fromSpec) {
    const num = parseInt(fromSpec.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  const text = `${product.name} ${product.description || ''}`.toUpperCase();
  const match = text.match(/(\d{3,4})\s*W\b/i) || text.match(/\b(P|UD|AE|GS|GM)?(\d{3,4})[GPMW]/i);
  if (match) {
    const w = parseInt(match[1] && !isNaN(Number(match[1])) ? match[1] : match[2], 10);
    if (w >= 300 && w <= 2000) return w;
  }
  return null;
}

/**
 * Checks if a candidate product is compatible with current selections in the PC Builder
 */
export function checkProductCompatibility(
  stepId: ComponentCategory,
  product: Product,
  selected: Record<ComponentCategory, SelectedComponent | null>
): { isCompatible: boolean; reason?: string; badgeText?: string } {
  const cpu = selected['cpu']?.product;
  const mobo = selected['motherboard']?.product;
  const gpu = selected['gpu']?.product;

  // 1. Motherboard Step (checked against CPU if CPU is already selected)
  if (stepId === 'motherboard' && cpu) {
    const cpuSock = detectCpuSocket(cpu);
    const moboSock = detectMotherboardSocket(product);

    if (cpuSock && moboSock) {
      if (cpuSock !== moboSock) {
        return {
          isCompatible: false,
          reason: `Incompatible: Requiere socket ${cpuSock} (esta placa es ${moboSock})`,
          badgeText: `Socket ${moboSock} ≠ ${cpuSock}`
        };
      }
      return {
        isCompatible: true,
        badgeText: `Socket ${cpuSock} Compatible ✓`
      };
    }
  }

  // 2. CPU Step (checked against Motherboard if Motherboard is already selected)
  if (stepId === 'cpu' && mobo) {
    const moboSock = detectMotherboardSocket(mobo);
    const cpuSock = detectCpuSocket(product);

    if (moboSock && cpuSock) {
      if (moboSock !== cpuSock) {
        return {
          isCompatible: false,
          reason: `Incompatible: Tu placa requiere socket ${moboSock} (este CPU es ${cpuSock})`,
          badgeText: `Socket ${cpuSock} ≠ ${moboSock}`
        };
      }
      return {
        isCompatible: true,
        badgeText: `Socket ${moboSock} Compatible ✓`
      };
    }
  }

  // 3. RAM Step (checked against Motherboard)
  if (stepId === 'ram' && mobo) {
    const moboRam = detectMotherboardRamType(mobo);
    const ramType = detectRamType(product);

    if (moboRam && ramType) {
      if (moboRam !== ramType) {
        return {
          isCompatible: false,
          reason: `Incompatible: Tu placa requiere ${moboRam} (esta memoria es ${ramType})`,
          badgeText: `${ramType} (Requiere ${moboRam})`
        };
      }
      return {
        isCompatible: true,
        badgeText: `${moboRam} Compatible ✓`
      };
    }
  }

  // 4. Power Supply (PSU) Step
  if (stepId === 'power_supply') {
    let minWattage = 450;
    if (cpu) minWattage += 65;
    if (gpu) {
      const gText = `${gpu.name} ${gpu.description || ''}`.toUpperCase();
      if (/RTX\s*4090|RTX\s*5090|6900\s*XT/i.test(gText)) minWattage = 850;
      else if (/RTX\s*4080|RTX\s*5080|RX\s*7900/i.test(gText)) minWattage = 750;
      else if (/RTX\s*4070|RTX\s*5070|RTX\s*3070/i.test(gText)) minWattage = 650;
      else if (/RTX\s*3060|RTX\s*4060|RTX\s*5060/i.test(gText)) minWattage = 550;
      else minWattage = 500;
    }

    const psuWattage = detectPsuWattage(product);
    if (psuWattage !== null) {
      if (psuWattage < minWattage) {
        return {
          isCompatible: false,
          reason: `Potencia insuficiente: ${psuWattage}W (Se recomienda ≥ ${minWattage}W)`,
          badgeText: `${psuWattage}W (Recomendado ≥ ${minWattage}W)`
        };
      }
      return {
        isCompatible: true,
        badgeText: `${psuWattage}W Recomendado ✓`
      };
    }
  }

  // 5. Cooler Step (checked against CPU socket)
  if (stepId === 'cooler' && cpu) {
    const cpuSock = detectCpuSocket(cpu);
    if (cpuSock) {
      const text = `${product.name} ${product.description || ''}`.toUpperCase();
      // If cooler specifies sockets
      if (text.includes('AM4') || text.includes('AM5') || text.includes('LGA1700') || text.includes('UNIVERSAL')) {
        const matches = text.includes(cpuSock) || text.includes('UNIVERSAL') || (cpuSock === 'AM5' && text.includes('AM4'));
        if (!matches) {
          return {
            isCompatible: false,
            reason: `Disipador no compatible con socket ${cpuSock}`,
            badgeText: `No compatible con ${cpuSock}`
          };
        }
      }
      return {
        isCompatible: true,
        badgeText: `Compatible con ${cpuSock} ✓`
      };
    }
  }

  return { isCompatible: true };
}

/**
 * Returns human-readable banner info explaining the active smart filter rule
 */
export function getStepSmartFilterRule(
  stepId: ComponentCategory,
  selected: Record<ComponentCategory, SelectedComponent | null>
): { message: string; submessage?: string } | null {
  const cpu = selected['cpu']?.product;
  const mobo = selected['motherboard']?.product;
  const gpu = selected['gpu']?.product;

  if (stepId === 'motherboard' && cpu) {
    const sock = detectCpuSocket(cpu);
    if (sock) {
      return {
        message: `Filtro inteligente activo: Mostrando tarjetas madre con Socket ${sock}`,
        submessage: `Compatible con tu ${cpu.name}`
      };
    }
  }

  if (stepId === 'cpu' && mobo) {
    const sock = detectMotherboardSocket(mobo);
    if (sock) {
      return {
        message: `Filtro inteligente activo: Mostrando procesadores con Socket ${sock}`,
        submessage: `Compatible con tu ${mobo.name}`
      };
    }
  }

  if (stepId === 'ram' && mobo) {
    const ramType = detectMotherboardRamType(mobo);
    if (ramType) {
      return {
        message: `Filtro inteligente activo: Mostrando memorias ${ramType}`,
        submessage: `Compatible con tu tarjeta madre (${mobo.name})`
      };
    }
  }

  if (stepId === 'power_supply' && (cpu || gpu)) {
    return {
      message: `Filtro inteligente activo: Mostrando fuentes recomendadas para tu consumo estimado`,
      submessage: `Calculado para tu ${[cpu?.name, gpu?.name].filter(Boolean).join(' + ')}`
    };
  }

  if (stepId === 'cooler' && cpu) {
    const sock = detectCpuSocket(cpu);
    if (sock) {
      return {
        message: `Filtro inteligente activo: Mostrando disipadores compatibles con Socket ${sock}`,
        submessage: `Para refrigerar tu ${cpu.name}`
      };
    }
  }

  return null;
}
