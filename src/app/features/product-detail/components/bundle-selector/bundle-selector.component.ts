import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductBundle } from '../../../../core/models/product.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-bundle-selector',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  templateUrl: './bundle-selector.component.html'
})
export class BundleSelectorComponent {
  readonly bundles = input<ProductBundle[]>([]);
  readonly selectedBundle = input<ProductBundle | null>(null);

  readonly bundleSelected = output<ProductBundle | null>();

  selectBundle(bundle: ProductBundle): void {
    if (this.selectedBundle()?.id === bundle.id) {
      this.bundleSelected.emit(null);
    } else {
      this.bundleSelected.emit(bundle);
    }
  }
}
