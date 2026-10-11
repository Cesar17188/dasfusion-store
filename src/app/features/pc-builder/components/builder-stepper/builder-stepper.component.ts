import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PcBuilderService } from '../../services/pc-builder.service';

@Component({
  selector: 'app-builder-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
      @for (step of pcBuilderService.steps(); track step.id; let idx = $index) {
        <button
          type="button"
          (click)="pcBuilderService.goToStep(idx)"
          class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border"
          [class.bg-primary/20]="pcBuilderService.currentStepIndex() === idx"
          [class.text-primary]="pcBuilderService.currentStepIndex() === idx"
          [class.border-primary/40]="pcBuilderService.currentStepIndex() === idx"
          [class.shadow-lg]="pcBuilderService.currentStepIndex() === idx"
          [class.bg-surface-container]="pcBuilderService.currentStepIndex() !== idx"
          [class.text-on-surface-variant]="pcBuilderService.currentStepIndex() !== idx"
          [class.border-outline-variant/40]="pcBuilderService.currentStepIndex() !== idx"
          [class.hover:border-outline]="pcBuilderService.currentStepIndex() !== idx"
        >
          <!-- Status icon / number -->
          <span
            class="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            [class.bg-primary]="pcBuilderService.currentStepIndex() === idx"
            [class.text-on-primary]="pcBuilderService.currentStepIndex() === idx"
            [class.bg-surface-container-high]="pcBuilderService.currentStepIndex() !== idx"
            [class.text-on-surface]="pcBuilderService.currentStepIndex() !== idx"
          >
            @if (pcBuilderService.selectedComponents()[step.id]) {
              ✓
            } @else {
              {{ idx + 1 }}
            }
          </span>
          <span>{{ step.name }}</span>
        </button>
      }
    </div>
  `
})
export class BuilderStepperComponent {
  readonly pcBuilderService = inject(PcBuilderService);
}
