import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/** Campo de palavra-passe com botão mostrar/ocultar (reutilizável em login, registo, CVV, etc.). */
@Component({
  selector: 'app-password-reveal-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './password-reveal-field.component.html',
  host: {
    class: 'block',
  },
})
export class PasswordRevealFieldComponent {
  readonly label = input.required<string>();
  /** Texto curto para `aria-label` (ex.: "palavra-passe", "código CVV"). */
  readonly labelAria = input.required<string>();
  readonly inputId = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly variant = input<'auth' | 'inline'>('auth');
  readonly autocomplete = input<string>('current-password');
  readonly placeholder = input<string>('••••••••');
  readonly maxLength = input<number | undefined>(undefined);
  readonly inputMode = input<string | undefined>(undefined);

  protected readonly visible = signal(false);

  protected toggle(): void {
    this.visible.update((v) => !v);
  }
}
