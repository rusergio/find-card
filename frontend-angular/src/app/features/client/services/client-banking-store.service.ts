import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, tap, type Observable } from 'rxjs';
import type { ClientAccount, ClientTransaction } from '../models/client-account.model';
import type { ClientPaymentCard } from '../models/client-payment-card.model';
import {
  BankingApiService,
  type ApiAccount,
  type ApiPaymentCard,
  type RegisterPaymentCardBody,
} from './banking-api.service';

function newId(prefix: string): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return `${prefix}-${c.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MOCK_TX: ClientTransaction[] = [
  {
    id: 'tx-1',
    accountId: 'acc-main',
    description: 'Transferência recebida',
    amount: 2500,
    kind: 'credit',
    bookedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx-2',
    accountId: 'acc-main',
    description: 'Pagamento cartão',
    amount: -84.99,
    kind: 'debit',
    bookedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class ClientBankingStoreService {
  private readonly bankingApi = inject(BankingApiService);

  private readonly _accounts = signal<ClientAccount[]>([]);
  private readonly _transactions = signal<ClientTransaction[]>(MOCK_TX);
  private readonly _paymentCards = signal<ClientPaymentCard[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _apiReady = signal(false);

  readonly accounts = this._accounts.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly paymentCards = this._paymentCards.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly apiReady = this._apiReady.asReadonly();

  readonly hasRegisteredCard = computed(() => this._paymentCards().length > 0);

  readonly totalBalance = computed(() =>
    this._accounts().reduce((sum, acc) => sum + acc.balance, 0),
  );

  readonly recentTransactions = computed(() =>
    [...this._transactions()]
      .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt))
      .slice(0, 8),
  );

  /** Carrega contas e cartões da API Spring (requer sessão JWT). */
  loadFromApi(): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      accounts: this.bankingApi.listAccounts(),
      cards: this.bankingApi.listPaymentCards(),
    }).subscribe({
      next: ({ accounts, cards }) => {
        this._accounts.set(accounts.map(mapApiAccount));
        this._paymentCards.set(cards.map(mapApiPaymentCard));
        this._apiReady.set(true);
        this._loading.set(false);
      },
      error: (err: unknown) => {
        this._loading.set(false);
        this._error.set(err instanceof Error ? err.message : 'Erro ao carregar dados bancários.');
      },
    });
  }

  registerPaymentCard(input: RegisterPaymentCardBody): Observable<ClientPaymentCard> {
    return this.bankingApi.registerPaymentCard(input).pipe(
      map((apiCard) => mapApiPaymentCard(apiCard)),
      tap((card) => this._paymentCards.update((rows) => [card, ...rows])),
    );
  }

  deposit(accountId: string, amount: number, note?: string): { ok: true } | { ok: false; error: string } {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'O montante do depósito deve ser maior que zero.' };
    }
    const source = this._accounts().find((a) => a.id === accountId);
    if (!source) {
      return { ok: false, error: 'Conta de destino não encontrada.' };
    }

    this._accounts.update((rows) =>
      rows.map((a) => (a.id === accountId ? { ...a, balance: round2(a.balance + amount) } : a)),
    );

    this.prependTransaction({
      id: newId('tx'),
      accountId,
      amount,
      kind: 'credit',
      description: note?.trim() || 'Depósito na conta',
      bookedAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  transfer(
    fromAccountId: string,
    toIban: string,
    amount: number,
    note?: string,
  ): { ok: true } | { ok: false; error: string } {
    const iban = toIban.trim();
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'O montante da transferência deve ser maior que zero.' };
    }
    if (!iban || iban.replace(/\s/g, '').length < 15) {
      return { ok: false, error: 'IBAN de destino inválido.' };
    }

    const accounts = this._accounts();
    const from = accounts.find((a) => a.id === fromAccountId);
    if (!from) {
      return { ok: false, error: 'Conta de origem não encontrada.' };
    }
    if (from.balance < amount) {
      return { ok: false, error: 'Saldo insuficiente para concluir a transferência.' };
    }

    const normalizedTarget = iban.replace(/\s/g, '').toUpperCase();
    const internalTarget = accounts.find(
      (a) => a.iban.replace(/\s/g, '').toUpperCase() === normalizedTarget,
    );

    this._accounts.update((rows) =>
      rows.map((a) => {
        if (a.id === fromAccountId) {
          return { ...a, balance: round2(a.balance - amount) };
        }
        if (internalTarget && a.id === internalTarget.id) {
          return { ...a, balance: round2(a.balance + amount) };
        }
        return a;
      }),
    );

    this.prependTransaction({
      id: newId('tx'),
      accountId: fromAccountId,
      amount: -amount,
      kind: 'debit',
      description: note?.trim() || `Transferência para ${formatIban(iban)}`,
      bookedAt: new Date().toISOString(),
    });

    if (internalTarget) {
      this.prependTransaction({
        id: newId('tx'),
        accountId: internalTarget.id,
        amount,
        kind: 'credit',
        description: `Transferência recebida de ${from.label}`,
        bookedAt: new Date().toISOString(),
      });
    }

    return { ok: true };
  }

  private prependTransaction(tx: ClientTransaction): void {
    this._transactions.update((rows) => [tx, ...rows]);
  }
}

function mapApiAccount(acc: ApiAccount, index: number): ClientAccount {
  const currency = acc.currency === 'EUR' ? 'EUR' : 'EUR';
  return {
    id: String(acc.id),
    iban: formatAccountAsIban(acc.accountNumber),
    label: index === 0 ? 'Conta a ordem' : `Conta ${acc.accountNumber.slice(-4)}`,
    balance: Number(acc.balance),
    currency,
  };
}

function mapApiPaymentCard(card: ApiPaymentCard): ClientPaymentCard {
  return {
    id: String(card.id),
    holderName: card.holderName,
    cardNumberMasked: card.cardNumberMasked,
    expiry: card.expiry,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatIban(iban: string): string {
  return iban
    .replace(/\s/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatAccountAsIban(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  const core = digits.padStart(21, '0').slice(-21);
  return `PT50 0002 ${core.slice(0, 4)} ${core.slice(4, 8)} ${core.slice(8, 12)} ${core.slice(12, 16)} ${core.slice(16, 21)}`;
}
