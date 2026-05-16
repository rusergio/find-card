import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { SessionUser } from '../../../../core/models/session-user';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-employee-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './employee-shell.component.html',
})
export class EmployeeShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  protected readonly user = this.auth.user;

  ngOnInit(): void {
    this.title.setTitle('Funcionário · Bank Management');
  }

  ngOnDestroy(): void {
    this.title.setTitle('Bank Management');
  }

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
}
