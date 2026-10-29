import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  PAYMENT_WHATSAPP_DISPLAY,
  PAYMENT_WHATSAPP_PHONE
} from '../../../core/constants/bank-accounts.constant';
import { CookieService } from '../../../core/services/cookie.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly cookieService = inject(CookieService);
  readonly currentYear = new Date().getFullYear();
  readonly whatsappPhone = PAYMENT_WHATSAPP_DISPLAY;
  readonly whatsappUrl = `https://wa.me/${PAYMENT_WHATSAPP_PHONE}`;
}
