import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import type { UserRole } from '../../../../core/models/user-role';
import { formatAuthHttpError } from '../../../../core/utils/auth-error.util';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PasswordRevealFieldComponent } from '../../../../shared/components/password-reveal-field/password-reveal-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PasswordRevealFieldComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly env = environment;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly forgotOpen = signal(false);
  protected readonly helpOpen = signal(false);
  protected readonly forgotFeedback = signal<string | null>(null);
  protected readonly forgotSubmitting = signal(false);
  protected readonly registrationSuccess = signal(false);
  protected readonly forgotEmail = this.fb.nonNullable.control('', [Validators.required, Validators.email]);

  protected readonly roleOptions: { value: UserRole; label: string; hint: string }[] = [
    { value: 'CLIENT', label: 'Cliente', hint: 'Internet banking e produtos' },
    { value: 'EMPLOYEE', label: 'Funcionário', hint: 'Operações e atendimento' },
    { value: 'ADMIN', label: 'Administrador', hint: 'Configuração e auditoria' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['CLIENT' as UserRole, [Validators.required]],
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.route.snapshot.queryParamMap.get('registered') === '1') {
        this.registrationSuccess.set(true);
      }
    }
  }

  protected dismissRegistrationNotice(): void {
    this.registrationSuccess.set(false);
  }

  protected openForgot(): void {
    this.forgotFeedback.set(null);
    this.forgotEmail.setValue(this.form.controls.email.value);
    this.forgotOpen.set(true);
  }

  protected closeForgot(): void {
    this.forgotOpen.set(false);
    this.forgotFeedback.set(null);
    this.forgotSubmitting.set(false);
  }

  protected toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  protected closeHelp(): void {
    this.helpOpen.set(false);
  }

  protected submitForgot(): void {
    this.forgotFeedback.set(null);
    if (this.forgotEmail.invalid) {
      this.forgotEmail.markAsTouched();
      return;
    }
    if (environment.auth.useMockLogin) {
      this.forgotFeedback.set(
        'Em modo demonstração o pedido não é enviado. Defina auth.useMockLogin: false e implemente POST no Spring para este fluxo.',
      );
      return;
    }
    this.forgotSubmitting.set(true);
    this.authApi.requestPasswordReset(this.forgotEmail.value).subscribe({
      next: () => {
        this.forgotSubmitting.set(false);
        this.forgotFeedback.set(
          'Se o email existir na base de dados, receberá instruções em breve. Verifique também a pasta de spam.',
        );
      },
      error: (err: unknown) => {
        this.forgotSubmitting.set(false);
        this.forgotFeedback.set(formatAuthHttpError(err));
      },
    });
  }

  protected onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password, role } = this.form.getRawValue();

    this.auth
      .signIn({ email, password, demoRole: role })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const u = this.auth.user();
          if (u) {
            void this.router.navigate([this.auth.homeSegmentForRole(u.role)]);
          }
        },
        error: (err: unknown) => {
          this.error.set(formatAuthHttpError(err));
        },
      });
  }
}
