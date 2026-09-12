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

  ngOnInit(): void {
    const num = this.route.snapshot.queryParams['orderNumber'];
    if (num) {
      this.orderNumber.set(num);
    }
  }
}
