import { Injectable, computed, signal } from '@angular/core';
import {
  ComponentCategory,
  ComponentStep,
  SelectedComponent,
  CompatibilityCheck
} from '../../../core/models/pc-builder.model';
import { Product } from '../../../core/models/product.model';
import {
  detectCpuSocket,
  detectMotherboardSocket,
  detectMotherboardRamType,
  detectRamType,
  detectPsuWattage
} from '../../../core/utils/pc-hardware.util';

export const BUILDER_STEPS: ComponentStep[] = [
  { id: 'cpu', name: 'Procesador (CPU)', description: 'El cerebro de tu máquina', required: true, order: 1, iconName: 'cpu' },
  { id: 'motherboard', name: 'Tarjeta Madre / Placa Madre', description: 'Compatibilidad y conexiones', required: true, order: 2, iconName: 'circuit' },
  { id: 'ram', name: 'Memoria RAM', description: 'Multitarea y velocidad de respuesta', required: true, order: 3, iconName: 'memory' },
  { id: 'gpu', name: 'Tarjeta Gráfica (GPU)', description: 'Potencia gráfica y FPS', required: false, order: 4, iconName: 'gpu' },
  { id: 'storage', name: 'Almacenamiento (SSD / NVMe)', description: 'Velocidad y capacidad de juegos', required: true, order: 5, iconName: 'hard-drive' },
  { id: 'power_supply', name: 'Fuente de Poder (PSU)', description: 'Alimentación eficiente y segura', required: true, order: 6, iconName: 'zap' },
  { id: 'case', name: 'Gabinete (Case)', description: 'Flujo de aire y diseño estético', required: true, order: 7, iconName: 'box' },
  { id: 'cooler', name: 'Disipador / Cooler', description: 'Refrigeración líquida o por aire', required: false, order: 8, iconName: 'wind' }
];

@Injectable({
  providedIn: 'root'
})
export class PcBuilderService {
  readonly steps = signal<ComponentStep[]>(BUILDER_STEPS);
  readonly currentStepIndex = signal<number>(0);

  private readonly selectedComponentsSignal = signal<Record<ComponentCategory, SelectedComponent | null>>({
    cpu: null,
    motherboard: null,
    ram: null,
    gpu: null,
    storage: null,
    power_supply: null,
    case: null,
    cooler: null,
    fans: null,
    operating_system: null
  });

  readonly selectedComponents = this.selectedComponentsSignal.asReadonly();

  readonly currentStep = computed(() => this.steps()[this.currentStepIndex()]);

  readonly totalPrice = computed(() => {
    const list = Object.values(this.selectedComponentsSignal()).filter(
      (item): item is SelectedComponent => item !== null
    );
    return list.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  });

  readonly estimatedWattage = computed(() => {
    let wattage = 100; // Base motherboard/fans
    const selected = this.selectedComponentsSignal();
    const cpu = selected['cpu'];
    const gpu = selected['gpu'];
    if (cpu) wattage += 120;
    if (gpu) wattage += 320;
    return wattage;
  });

  readonly compatibility = computed<CompatibilityCheck>(() => {
    const issues: string[] = [];
    const selected = this.selectedComponentsSignal();
    const cpu = selected['cpu']?.product;
    const mobo = selected['motherboard']?.product;
    const ram = selected['ram']?.product;
    const psu = selected['power_supply']?.product;
    const estimatedWatts = this.estimatedWattage();

    if (cpu && mobo) {
      const cpuSocket = detectCpuSocket(cpu);
      const moboSocket = detectMotherboardSocket(mobo);
      if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
        issues.push(`Incompatibilidad de Socket: El procesador es ${cpuSocket} pero la Tarjeta Madre es ${moboSocket}`);
      }
    }

    if (mobo && ram) {
      const moboRam = detectMotherboardRamType(mobo);
      const ramType = detectRamType(ram);
      if (moboRam && ramType && moboRam !== ramType) {
        issues.push(`Incompatibilidad de Memoria: La Tarjeta Madre requiere ${moboRam} pero la memoria RAM es ${ramType}`);
      }
    }

    if (psu) {
      const psuWatts = detectPsuWattage(psu);
      if (psuWatts !== null && psuWatts < estimatedWatts) {
        issues.push(`Potencia Insuficiente: La fuente entrega ${psuWatts}W pero el consumo estimado es ${estimatedWatts}W`);
      }
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      estimatedWattage: estimatedWatts
    };
  });

  selectComponent(stepId: ComponentCategory, product: Product): void {
    this.selectedComponentsSignal.update((curr) => {
      const next = {
        ...curr,
        [stepId]: { stepId, product, quantity: 1 }
      };

      // Auto-invalidation if upstream component changes
      if (stepId === 'cpu' && curr.motherboard) {
        const newCpuSock = detectCpuSocket(product);
        const moboSock = detectMotherboardSocket(curr.motherboard.product);
        if (newCpuSock && moboSock && newCpuSock !== moboSock) {
          next.motherboard = null;
        }
      } else if (stepId === 'motherboard' && curr.ram) {
        const newMoboRam = detectMotherboardRamType(product);
        const ramType = detectRamType(curr.ram.product);
        if (newMoboRam && ramType && newMoboRam !== ramType) {
          next.ram = null;
        }
      }

      return next;
    });
  }

  removeComponent(stepId: ComponentCategory): void {
    this.selectedComponentsSignal.update((curr) => ({
      ...curr,
      [stepId]: null
    }));
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps().length) {
      this.currentStepIndex.set(index);
    }
  }

  nextStep(): void {
    if (this.currentStepIndex() < this.steps().length - 1) {
      this.currentStepIndex.update((i) => i + 1);
    }
  }

  prevStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update((i) => i - 1);
    }
  }

  resetBuild(): void {
    this.selectedComponentsSignal.set({
      cpu: null,
      motherboard: null,
      ram: null,
      gpu: null,
      storage: null,
      power_supply: null,
      case: null,
      cooler: null,
      fans: null,
      operating_system: null
    });
    this.currentStepIndex.set(0);
  }
}
