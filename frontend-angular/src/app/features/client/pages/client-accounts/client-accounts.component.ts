import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ClientAccount } from '../../models/client-account.model';
import { ClientBankingStoreService } from '../../services/client-banking-store.service';
import { PasswordRevealFieldComponent } from '../../../../shared/components/password-reveal-field/password-reveal-field.component';

type SavedCard = {
  id: string;
  holderName: string;
  cardNumberMasked: string;
  expiry: string;
};

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, PasswordRevealFieldComponent],
  templateUrl: './client-accounts.component.html',
})
export class ClientAccountsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly banking = inject(ClientBankingStoreService);
  protected readonly hiddenBalances = signal<Record<string, boolean>>({});
  protected readonly cardSuccess = signal<string | null>(null);
  protected readonly savedCards = signal<SavedCard[]>([]);

  protected readonly cardForm = this.fb.nonNullable.group({
    holderName: ['', [Validators.required, Validators.minLength(3)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  protected maskedCardNumber(account: ClientAccount): string {
    const digits = account.iban.replace(/\D/g, '');
    const last4 = digits.slice(-4).padStart(4, '0');
    return `**** **** **** ${last4}`;
  }

  protected isBalanceHidden(accountId: string): boolean {
    return !!this.hiddenBalances()[accountId];
  }

  protected toggleBalance(accountId: string): void {
    this.hiddenBalances.update((state) => ({
      ...state,
      [accountId]: !state[accountId],
    }));
  }

  protected maskedAmount(account: ClientAccount): string {
    return `**** ${account.currency}`;
  }

  protected submitCard(): void {
    this.cardSuccess.set(null);
    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      return;
    }

    const v = this.cardForm.getRawValue();
    this.savedCards.update((rows) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        holderName: v.holderName.trim(),
        cardNumberMasked: `**** **** **** ${v.cardNumber.slice(-4)}`,
        expiry: v.expiry,
      },
      ...rows,
    ]);

    this.cardSuccess.set('Cartão registado com sucesso.');
    this.cardForm.reset({
      holderName: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
    });
  }
}
