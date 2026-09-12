import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);

  readonly toggleSidebar = output<void>();

  protected readonly isSearchOpen = signal<boolean>(false);

  onSearchToggle(): void {
    this.isSearchOpen.update((v) => !v);
  }
}
