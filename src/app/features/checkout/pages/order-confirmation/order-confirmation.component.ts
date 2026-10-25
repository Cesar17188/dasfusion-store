import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  templateUrl: './order-confirmation.component.html'
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly orderNumber = signal<string>('DAS-894123');
  protected readonly email = signal<string>('');
  protected readonly name = signal<string>('');
  protected readonly taxId = signal<string>('');
  protected readonly total = signal<number | null>(null);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams;
    if (q['orderNumber']) {
      this.orderNumber.set(q['orderNumber']);
    }
    if (q['email']) {
      this.email.set(q['email']);
    }
    if (q['name']) {
      this.name.set(q['name']);
    }
    if (q['taxId']) {
      this.taxId.set(q['taxId']);
    }
    if (q['total'] !== undefined && q['total'] !== null) {
      this.total.set(Number(q['total']));
    }
  }
}
