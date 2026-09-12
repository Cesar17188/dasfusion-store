import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
      [class]="buttonClasses()"
    >
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  readonly clicked = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  buttonClasses(): string {
    const base =
      'inline-flex items-center justify-center font-semibold font-sans transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121316] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded-lg';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base'
    };

    // DASFusion Core design tokens: Primary is #f2f3f5 with #1b365d text
    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-[#f2f3f5] text-[#1b365d] hover:bg-[#ffffff] hover:shadow-[0_4px_14px_rgba(242,243,245,0.25)] hover:-translate-y-0.5 active:bg-[#f2f3f5]/90 active:translate-y-0 focus:ring-[#aec7f7]',
      secondary: 'bg-transparent text-[#f2f3f5] border border-[#f2f3f5]/60 hover:border-[#ffffff] hover:bg-[#f2f3f5]/10 focus:ring-[#aec7f7]',
      accent: 'bg-[#1b365d] text-[#aec7f7] border border-[#aec7f7]/30 hover:bg-[#1e3d68] hover:border-[#aec7f7] focus:ring-[#aec7f7]',
      outline: 'bg-transparent text-[#c4c6cf] border border-[#44474e] hover:border-[#8e9099] hover:text-[#e3e2e6] hover:bg-[#1e2022]',
      danger: 'bg-[#93000a] text-[#ffdad6] hover:bg-[#690005] border border-[#ffb4ab]/30 focus:ring-[#ffb4ab]',
      ghost: 'bg-transparent text-[#c4c6cf] hover:text-[#e3e2e6] hover:bg-[#1e2022]'
    };

    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${width}`;
  }
}
