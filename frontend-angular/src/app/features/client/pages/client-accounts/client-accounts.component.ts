import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ClientAccount } from '../../models/client-account.model';
import { ClientBankingStoreService } from '../../services/client-banking-store.service';
import { PasswordRevealFieldComponent } from '../../../../shared/components/password-reveal-field/password-reveal-field.component';

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, PasswordRevealFieldComponent],
  templateUrl: './client-accounts.component.html',
})
export class ClientAccountsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly banking = inject(ClientBankingStoreService);
  protected readonly hiddenBalances = signal<Record<string, boolean>>({});
  protected readonly cardSuccess = signal<string | null>(null);

  protected readonly cardForm = this.fb.nonNullable.group({
    holderName: ['', [Validators.required, Validators.minLength(3)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  ngOnInit(): void {
    this.banking.reloadPaymentCardsFromStorage();
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
    this.banking.registerPaymentCard({
      holderName: v.holderName,
      cardNumber: v.cardNumber,
      expiry: v.expiry,
    });

    this.cardSuccess.set('Cartão registado com sucesso.');
    this.cardForm.reset({
      holderName: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
    });
  }
}
