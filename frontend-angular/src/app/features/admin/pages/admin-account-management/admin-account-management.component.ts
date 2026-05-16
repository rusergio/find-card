import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PasswordRevealFieldComponent } from '../../../../shared/components/password-reveal-field/password-reveal-field.component';

type DeviceRow = { id: string; label: string; lastActive: Date; location: string; current: boolean };

@Component({
  selector: 'app-admin-account-management',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PasswordRevealFieldComponent],
  templateUrl: './admin-account-management.component.html',
})
export class AdminAccountManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly user = this.auth.user;
  protected readonly toast = signal<{ type: 'ok' | 'err'; text: string } | null>(null);
  protected readonly deleteModalOpen = signal(false);
  protected readonly mfaEnabled = signal(true);
  protected readonly exportBusy = signal(false);
  protected readonly showRecoveryPin = signal(false);
  protected readonly showConfirmPin = signal(false);

  protected readonly passwordForm = this.fb.nonNullable.group({
    current: ['', [Validators.required, Validators.minLength(6)]],
    next: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  protected readonly recoveryForm = this.fb.nonNullable.group({
    recoveryPinEnabled: [false],
    pin1: ['', [Validators.pattern(/^\d?$/)]],
    pin2: ['', [Validators.pattern(/^\d?$/)]],
    pin3: ['', [Validators.pattern(/^\d?$/)]],
    pin4: ['', [Validators.pattern(/^\d?$/)]],
    confirmPin1: ['', [Validators.pattern(/^\d?$/)]],
    confirmPin2: ['', [Validators.pattern(/^\d?$/)]],
    confirmPin3: ['', [Validators.pattern(/^\d?$/)]],
    confirmPin4: ['', [Validators.pattern(/^\d?$/)]],
  });

  protected readonly devices = signal<DeviceRow[]>([
    {
      id: 'd1',
      label: 'Este dispositivo · Windows · Consola admin',
      lastActive: new Date(),
      location: 'Lisboa, PT',
      current: true,
    },
    {
      id: 'd2',
      label: 'Chrome · Android',
      lastActive: new Date(Date.now() - 86_400_000 * 2),
      location: 'Porto, PT',
      current: false,
    },
    {
      id: 'd3',
      label: 'Safari · macOS · Escritório',
      lastActive: new Date(Date.now() - 86_400_000 * 12),
      location: 'Lisboa, PT',
      current: false,
    },
  ]);

  protected toggleMfa(): void {
    this.mfaEnabled.update((v) => !v);
    this.flash(
      `Autenticação em dois passos ${this.mfaEnabled() ? 'ativada (simulado)' : 'desativada'}.`,
      'ok',
    );
  }

  protected submitPassword(): void {
    const { next, confirm } = this.passwordForm.getRawValue();
    this.toast.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.flash('Revise os campos da palavra-passe.', 'err');
      return;
    }
    if (next !== confirm) {
      this.flash('A confirmação não coincide com a nova palavra-passe.', 'err');
      return;
    }
    this.passwordForm.reset({ current: '', next: '', confirm: '' });
    this.flash(
      'Pedido de alteração registado nesta sessão de demonstração. Quando existir PATCH na API, substitua este fluxo.',
      'ok',
    );
  }

  protected saveRecoveryPin(): void {
    this.toast.set(null);
    if (!this.recoveryForm.controls.recoveryPinEnabled.value) {
      this.flash('PIN de recuperação desativado.', 'ok');
      return;
    }

    const pin = this.recoveryPinValue();
    const confirmPin = this.recoveryPinConfirmValue();
    if (!/^\d{4}$/.test(pin) || pin !== confirmPin) {
      this.recoveryForm.markAllAsTouched();
      this.flash('PIN inválido. Introduza 4 dígitos e confirme corretamente.', 'err');
      return;
    }

    this.flash('PIN de recuperação guardado com sucesso.', 'ok');
  }

  protected onPinInput(
    controlName:
      | 'pin1'
      | 'pin2'
      | 'pin3'
      | 'pin4'
      | 'confirmPin1'
      | 'confirmPin2'
      | 'confirmPin3'
      | 'confirmPin4',
    event: Event,
    nextId?: string,
  ): void {
    const input = event.target as HTMLInputElement;
    const digit = (input.value || '').replace(/\D/g, '').slice(-1);
    this.recoveryForm.controls[controlName].setValue(digit);
    input.value = digit;
    if (digit && nextId && isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(nextId) as HTMLInputElement | null;
      el?.focus();
    }
  }

  protected onPinBackspace(event: KeyboardEvent, prevId?: string): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && prevId && isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(prevId) as HTMLInputElement | null;
      el?.focus();
    }
  }

  protected recoveryPinValue(): string {
    const v = this.recoveryForm.getRawValue();
    return `${v.pin1}${v.pin2}${v.pin3}${v.pin4}`;
  }

  protected recoveryPinConfirmValue(): string {
    const v = this.recoveryForm.getRawValue();
    return `${v.confirmPin1}${v.confirmPin2}${v.confirmPin3}${v.confirmPin4}`;
  }

  protected toggleShowRecoveryPin(): void {
    this.showRecoveryPin.update((v) => !v);
  }

  protected toggleShowConfirmPin(): void {
    this.showConfirmPin.update((v) => !v);
  }

  protected toggleRecoveryPinEnabled(): void {
    this.recoveryForm.controls.recoveryPinEnabled.setValue(
      !this.recoveryForm.controls.recoveryPinEnabled.value,
    );
  }

  protected revoke(deviceId: string): void {
    this.devices.update((rows) => rows.filter((d) => d.id !== deviceId || d.current));
    this.flash('Sessão encerrada (simulação — sincronizar com servidor depois).', 'ok');
  }

  protected exportData(): void {
    this.exportBusy.set(true);
    window.setTimeout(() => {
      this.exportBusy.set(false);
      this.flash(
        'Pedido de exportação registado. Receberá um email quando o ficheiro estiver disponível (mock).',
        'ok',
      );
    }, 1400);
  }

  protected openDelete(): void {
    this.deleteModalOpen.set(true);
  }

  protected closeDelete(): void {
    this.deleteModalOpen.set(false);
  }

  protected confirmDelete(): void {
    this.deleteModalOpen.set(false);
    this.flash(
      'Demonstração: nenhuma conta foi eliminada. Operação só permitida via fluxo de offboarding interno.',
      'err',
    );
  }

  private flash(msg: string, type: 'ok' | 'err'): void {
    this.toast.set({ type, text: msg });
    window.setTimeout(() => this.toast.set(null), 4200);
  }
}
