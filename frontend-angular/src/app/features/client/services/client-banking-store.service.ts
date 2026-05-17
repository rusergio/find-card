import { computed, inject, Injectable, signal } from '@angular/core';
import { map, tap, type Observable } from 'rxjs';
import type { ClientTransaction } from '../models/client-account.model';
import type { ClientPaymentCard } from '../models/client-payment-card.model';
import {
  BankingApiService,
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

@Injectable({ providedIn: 'root' })
export class ClientBankingStoreService {
  private readonly bankingApi = inject(BankingApiService);

  private readonly _transactions = signal<ClientTransaction[]>([]);
  private readonly _paymentCards = signal<ClientPaymentCard[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _apiReady = signal(false);

  readonly transactions = this._transactions.asReadonly();
  readonly paymentCards = this._paymentCards.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly apiReady = this._apiReady.asReadonly();

  readonly hasRegisteredCard = computed(() => this._paymentCards().length > 0);

  readonly totalBalance = computed(() =>
    this._paymentCards().reduce((sum, card) => sum + card.balance, 0),
  );

  readonly recentTransactions = computed(() =>
    [...this._transactions()]
      .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt))
      .slice(0, 8),
  );

  /** Carrega cartões de pagamento da API (requer sessão JWT). */
  loadPaymentCardsFromApi(): void {
    this._loading.set(true);
    this._error.set(null);

    this.bankingApi.listPaymentCards().subscribe({
      next: (cards) => {
        this._paymentCards.set(cards.map(mapApiPaymentCard));
        this._apiReady.set(true);
        this._loading.set(false);
      },
      error: (err: unknown) => {
        this._loading.set(false);
        this._error.set(err instanceof Error ? err.message : 'Erro ao carregar os cartões.');
      },
    });
  }

  registerPaymentCard(input: RegisterPaymentCardBody): Observable<ClientPaymentCard> {
    return this.bankingApi.registerPaymentCard(input).pipe(
      map((apiCard) => mapApiPaymentCard(apiCard)),
      tap((card) => this._paymentCards.update((rows) => [card, ...rows])),
    );
  }

  depositOnCard(cardId: string, amount: number, note?: string): { ok: true } | { ok: false; error: string } {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'O montante do depósito deve ser maior que zero.' };
    }
    const card = this._paymentCards().find((c) => c.id === cardId);
    if (!card) {
      return { ok: false, error: 'Cartão não encontrado.' };
    }

    this._paymentCards.update((rows) =>
      rows.map((c) => (c.id === cardId ? { ...c, balance: round2(c.balance + amount) } : c)),
    );

    this.prependTransaction({
      id: newId('tx'),
      accountId: cardId,
      amount,
      kind: 'credit',
      description: note?.trim() || 'Depósito no cartão',
      bookedAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  transferFromCard(
    cardId: string,
    amount: number,
    note?: string,
  ): { ok: true } | { ok: false; error: string } {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: 'O montante da transferência deve ser maior que zero.' };
    }

    const card = this._paymentCards().find((c) => c.id === cardId);
    if (!card) {
      return { ok: false, error: 'Cartão não encontrado.' };
    }
    if (card.balance < amount) {
      return { ok: false, error: 'Saldo insuficiente para concluir a transferência.' };
    }

    this._paymentCards.update((rows) =>
      rows.map((c) => (c.id === cardId ? { ...c, balance: round2(c.balance - amount) } : c)),
    );

    this.prependTransaction({
      id: newId('tx'),
      accountId: cardId,
      amount: -amount,
      kind: 'debit',
      description: note?.trim() || 'Transferência enviada',
      bookedAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  private prependTransaction(tx: ClientTransaction): void {
    this._transactions.update((rows) => [tx, ...rows]);
  }
}

function mapApiPaymentCard(card: ApiPaymentCard): ClientPaymentCard {
  return {
    id: String(card.id),
    holderName: card.holderName,
    cardNumberMasked: card.cardNumberMasked,
    expiry: card.expiry,
    balance: Number(card.balance ?? 0),
    currency: card.currency === 'EUR' ? 'EUR' : 'EUR',
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
