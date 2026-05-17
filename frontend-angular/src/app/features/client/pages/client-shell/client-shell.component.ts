import { isPlatformBrowser, NgClass } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { SessionUser } from '../../../../core/models/session-user';
import { AuthService } from '../../../../core/services/auth.service';
import { ClientBankingStoreService } from '../../services/client-banking-store.service';

const SIDEBAR_COLLAPSED_KEY = 'bm-client-sidebar-collapsed';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  templateUrl: './client-shell.component.html',
})
export class ClientShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly banking = inject(ClientBankingStoreService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly user = this.auth.user;
  /** Só ícones na barra lateral (texto oculto). */
  protected readonly sidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.title.setTitle('Cliente · Bank Management');
    if (isPlatformBrowser(this.platformId)) {
      this.banking.loadPaymentCardsFromApi();
      this.sidebarCollapsed.set(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
    }
  }

  ngOnDestroy(): void {
    this.title.setTitle('Bank Management');
  }

  /** Nome para a primeira linha; com dados da API (`/auth/me`) mostra nome completo. */
  protected profileName(u: SessionUser): string {
    const full = u.fullName?.trim();
    if (full) {
      return full;
    }
    const dn = u.displayName?.trim();
    if (dn && dn.toLowerCase() !== u.email.trim().toLowerCase()) {
      return dn;
    }
    const at = u.email.indexOf('@');
    return at > 0 ? u.email.slice(0, at) : u.email;
  }

  protected profileInitial(u: SessionUser): string {
    const name = this.profileName(u);
    const letter = name.match(/\p{L}/u)?.[0] ?? name.charAt(0);
    return letter ? letter.toUpperCase() : '?';
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, this.sidebarCollapsed() ? '1' : '0');
    }
  }
}
