import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-[#1e2022] border border-[#e3e2e6]/10 rounded-2xl p-6 transition-all duration-200"
      [class.hover:border-[#aec7f7]/30]="hoverable()"
      [class.hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]]="hoverable()"
      [class.hover:-translate-y-0.5]="hoverable()"
    >
      @if (title()) {
        <div class="mb-4 pb-3 border-b border-[#44474e]/50 flex items-center justify-between">
          <h4 class="text-headline-sm text-[#e3e2e6]">{{ title() }}</h4>
          <ng-content select="[card-header-action]"></ng-content>
        </div>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  readonly title = input<string>('');
  readonly hoverable = input<boolean>(false);
}
