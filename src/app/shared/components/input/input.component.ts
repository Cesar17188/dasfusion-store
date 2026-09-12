import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full flex flex-col gap-1.5">
      @if (label()) {
        <label [for]="id()" class="text-xs font-semibold uppercase tracking-wider text-[#c4c6cf]">
          {{ label() }}
          @if (required()) {
            <span class="text-[#ffb4ab]">*</span>
          }
        </label>
      }

      <div class="relative flex items-center">
        <input
          [id]="id()"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="w-full bg-[#1e2022] text-[#e3e2e6] placeholder-[#8e9099] text-sm rounded-lg border border-[#44474e] px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-[#aec7f7] focus:ring-2 focus:ring-[#aec7f7]/25 disabled:opacity-40 disabled:cursor-not-allowed"
          [class.border-[#ffb4ab]]="!!error()"
        />
      </div>

      @if (error()) {
        <span class="text-xs text-[#ffb4ab] mt-0.5">{{ error() }}</span>
      } @else if (hint()) {
        <span class="text-xs text-[#8e9099] mt-0.5">{{ hint() }}</span>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  readonly id = input<string>(`input-${Math.random().toString(36).substring(2, 9)}`);
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly required = input<boolean>(false);
  readonly error = input<string>('');
  readonly hint = input<string>('');

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
