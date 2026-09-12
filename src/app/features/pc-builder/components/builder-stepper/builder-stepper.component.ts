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
          [class.bg-[#1b365d]]="pcBuilderService.currentStepIndex() === idx"
          [class.text-[#aec7f7]]="pcBuilderService.currentStepIndex() === idx"
          [class.border-[#aec7f7]/40]="pcBuilderService.currentStepIndex() === idx"
          [class.shadow-lg]="pcBuilderService.currentStepIndex() === idx"
          [class.bg-[#1e2022]]="pcBuilderService.currentStepIndex() !== idx"
          [class.text-[#c4c6cf]]="pcBuilderService.currentStepIndex() !== idx"
          [class.border-[#44474e]/40]="pcBuilderService.currentStepIndex() !== idx"
          [class.hover:border-[#8e9099]]="pcBuilderService.currentStepIndex() !== idx"
        >
          <!-- Status icon / number -->
          <span
            class="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            [class.bg-[#aec7f7]]="pcBuilderService.currentStepIndex() === idx"
            [class.text-[#143057]]="pcBuilderService.currentStepIndex() === idx"
            [class.bg-[#343538]]="pcBuilderService.currentStepIndex() !== idx"
            [class.text-[#e3e2e6]]="pcBuilderService.currentStepIndex() !== idx"
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
