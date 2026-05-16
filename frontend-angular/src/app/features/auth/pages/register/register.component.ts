import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { formatAuthHttpError } from '../../../../core/utils/auth-error.util';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { PasswordRevealFieldComponent } from '../../../../shared/components/password-reveal-field/password-reveal-field.component';

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass = group.get('password')?.value as string | undefined;
  const confirm = group.get('confirmPassword')?.value as string | undefined;
  if (!pass || !confirm || pass === confirm) {
    return null;
  }
  return { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PasswordRevealFieldComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly env = environment;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  protected onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, fullName } = this.form.getRawValue();
    this.submitting.set(true);
    this.authApi
      .register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/login'], {
            queryParams: { registered: '1' },
          }),
        error: (err: unknown) => {
          this.error.set(formatAuthHttpError(err));
        },
      });
  }
}
