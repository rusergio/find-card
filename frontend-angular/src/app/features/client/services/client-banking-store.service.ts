import { computed, Injectable, signal } from '@angular/core';
import type { ClientAccount, ClientTransaction } from '../models/client-account.model';

function newId(prefix: string): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return `${prefix}-${c.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MOCK_ACCOUNTS: ClientAccount[] = [
  {
    id: 'acc-main',
    iban: 'PT50 0002 0123 1234 5678 9015 4',
    label: 'Conta a ordem',
    balance: 18450.37,
    currency: 'EUR',
  },
  {
    id: 'acc-save',
    iban: 'PT50 0002 0123 9876 5432 1056 8',
    label: 'Conta poupança',
    balance: 9375.12,
    currency: 'EUR',
  },
];

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
  {
    id: 'tx-3',
    accountId: 'acc-save',
    description: 'Reforço poupança',
    amount: 500,
    kind: 'credit',
    bookedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'tx-4',
    accountId: 'acc-main',
    description: 'Débito direto energia',
    amount: -61.2,
    kind: 'debit',
    bookedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class ClientBankingStoreService {
  private readonly _accounts = signal<ClientAccount[]>(MOCK_ACCOUNTS);
  private readonly _transactions = signal<ClientTransaction[]>(MOCK_TX);

  readonly accounts = this._accounts.asReadonly();
  readonly transactions = this._transactions.asReadonly();

  readonly totalBalance = computed(() =>
    this._accounts().reduce((sum, acc) => sum + acc.balance, 0),
  );

  readonly recentTransactions = computed(() =>
    [...this._transactions()]
      .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt))
      .slice(0, 8),
  );

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatIban(iban: string): string {
  return iban
    .replace(/\s/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
