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
  protected readonly total = signal<number | null>(null);

  ngOnInit(): void {
    const num = this.route.snapshot.queryParams['orderNumber'];
    if (num) {
      this.orderNumber.set(num);
    }
    const em = this.route.snapshot.queryParams['email'];
    if (em) {
      this.email.set(em);
    }
    const tot = this.route.snapshot.queryParams['total'];
    if (tot !== undefined && tot !== null) {
      this.total.set(Number(tot));
    }
  }
}

