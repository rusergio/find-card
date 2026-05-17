import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ClientAccount } from '../../models/client-account.model';
import { ClientBankingStoreService } from '../../services/client-banking-store.service';
import {
  buildExpiryMmYy,
  digitsOnly,
  EXPIRY_MONTHS,
  expiryYearOptions,
  formatCardNumberDisplay,
  sanitizeHolderName,
} from '../../utils/card-input.util';
import {
  cardNumberLuhnValidator,
  cvcValidator,
  expiryGroupValidator,
  fieldErrorMessage,
  holderNameValidator,
} from '../../utils/card-form.validators';

const LEGACY_CARDS_PREFIX = 'fc_payment_cards:';

@Component({
  selector: 'app-client-accounts',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './client-accounts.component.html',
})
export class ClientAccountsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly banking = inject(ClientBankingStoreService);
  protected readonly hiddenBalances = signal<Record<string, boolean>>({});
  protected readonly cardSuccess = signal<string | null>(null);
  protected readonly cardError = signal<string | null>(null);
  protected readonly submittingCard = signal(false);
  protected readonly cardNumberDisplay = signal('');

  protected readonly expiryMonths = EXPIRY_MONTHS;
  protected readonly expiryYears = expiryYearOptions();

  protected readonly cardForm = this.fb.nonNullable.group(
    {
      holderName: ['', [Validators.required, holderNameValidator]],
      cardNumber: ['', [Validators.required, cardNumberLuhnValidator]],
      expiryMonth: ['', Validators.required],
      expiryYear: ['', Validators.required],
      cvc: ['', [Validators.required, cvcValidator]],
    },
    { validators: expiryGroupValidator },
  );

  protected readonly fieldErrors = {
    holderName: {
      required: 'Indique o nome como aparece no cartão.',
      holderNameMin: 'O nome deve ter pelo menos 3 letras.',
      holderNameFormat: 'Use apenas letras, espaços, hífen ou apóstrofo.',
      holderNameNoDigits: 'O nome não pode conter números.',
    },
    cardNumber: {
      required: 'Indique os 16 dígitos do cartão.',
      cardNumberLength: 'O número deve ter exatamente 16 dígitos.',
      cardNumberLuhn: 'Número de cartão inválido.',
    },
    expiryMonth: { required: 'Selecione o mês.' },
    expiryYear: { required: 'Selecione o ano.' },
    cvc: {
      required: 'Indique o código de segurança.',
      cvcFormat: 'O CVV deve ter exatamente 3 dígitos.',
    },
  } as const;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.clearLegacyMockCards();
      this.banking.loadFromApi();
    }
  }

  protected fieldError(controlName: keyof typeof this.fieldErrors): string | null {
    const control = this.cardForm.get(controlName);
    const labels = this.fieldErrors[controlName] as Record<string, string>;
    return fieldErrorMessage(control, labels);
  }

  protected expiryPastError(): string | null {
    if (!this.cardForm.touched && !this.cardForm.dirty) {
      return null;
    }
    if (this.cardForm.errors?.['expiryPast']) {
      return 'A validade não pode estar no passado.';
    }
    return null;
  }

  protected onHolderNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = sanitizeHolderName(input.value);
    input.value = cleaned;
    this.cardForm.controls.holderName.setValue(cleaned, { emitEvent: true });
  }

  protected onHolderNameBlur(): void {
    const normalized = sanitizeHolderName(this.cardForm.controls.holderName.value).trim();
    this.cardForm.controls.holderName.setValue(normalized);
  }

  protected onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = digitsOnly(input.value, 16);
    input.value = formatCardNumberDisplay(digits);
    this.cardNumberDisplay.set(input.value);
    this.cardForm.controls.cardNumber.setValue(digits, { emitEvent: true });
  }

  protected onCvcInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = digitsOnly(input.value, 3);
    input.value = digits;
    this.cardForm.controls.cvc.setValue(digits, { emitEvent: true });
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
    this.cardError.set(null);
    this.cardForm.markAllAsTouched();
    if (this.cardForm.invalid) {
      return;
    }

    const v = this.cardForm.getRawValue();
    const expiry = buildExpiryMmYy(v.expiryMonth, v.expiryYear);

    this.submittingCard.set(true);

    this.banking
      .registerPaymentCard({
        holderName: sanitizeHolderName(v.holderName).trim(),
        cardNumber: v.cardNumber,
        expiry,
        cvc: v.cvc,
      })
      .subscribe({
        next: () => {
          this.submittingCard.set(false);
          this.cardSuccess.set('Cartão registado com sucesso.');
          this.cardForm.reset();
          this.cardNumberDisplay.set('');
        },
        error: (err: unknown) => {
          this.submittingCard.set(false);
          this.cardError.set(err instanceof Error ? err.message : 'Não foi possível registar o cartão.');
        },
      });
  }

  private clearLegacyMockCards(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_CARDS_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}
