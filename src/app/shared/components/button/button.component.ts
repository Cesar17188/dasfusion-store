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
      'inline-flex items-center justify-center font-bold font-sans transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded-lg';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base'
    };

    // DASFusion Core high-contrast button tokens
    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-[#f2f3f5] text-[#0a1b33] hover:bg-white hover:text-black hover:shadow-[0_4px_16px_rgba(242,243,245,0.35)] hover:-translate-y-0.5 active:bg-[#f2f3f5]/90 active:translate-y-0 focus:ring-primary',
      secondary: 'bg-transparent text-white border-2 border-primary/80 hover:border-primary hover:bg-primary/15 hover:text-white focus:ring-primary',
      accent: 'bg-primary-container text-white border border-primary/50 hover:bg-[#234577] hover:border-primary focus:ring-primary',
      outline: 'bg-transparent text-on-surface border border-[#5a5d66] hover:border-primary hover:text-white hover:bg-surface-container',
      danger: 'bg-[#ba1a1a] text-white hover:bg-error-container border border-error/40 focus:ring-error',
      ghost: 'bg-transparent text-on-surface-variant hover:text-white hover:bg-surface-container-high'
    };

    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${width}`;
  }
}
