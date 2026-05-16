import { computed, Injectable, signal } from '@angular/core';
import type { CounterOperation } from '../models/counter-operation.model';

function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const INITIAL_OPERATIONS: CounterOperation[] = [
  {
    id: 'op-1',
    customerName: 'Ana Martins',
    customerIban: 'PT50 0002 0456 9876 5432 1098 4',
    amount: 1200,
    type: 'DEPOSIT',
    note: 'Depósito numerário',
    status: 'DONE',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'op-2',
    customerName: 'Carlos Mendes',
    customerIban: 'PT50 0002 0456 3333 2222 1111 9',
    amount: 300,
    type: 'WITHDRAWAL',
    note: 'Levantamento ao balcão',
    status: 'DONE',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class EmployeeOperationsStoreService {
  private readonly _operations = signal<CounterOperation[]>(INITIAL_OPERATIONS);

  readonly operations = this._operations.asReadonly();
  readonly count = computed(() => this._operations().length);
  readonly totalToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this._operations()
      .filter((op) => op.createdAt.startsWith(today))
      .reduce((sum, op) => sum + op.amount, 0);
  });

  add(input: Omit<CounterOperation, 'id' | 'status' | 'createdAt'>): void {
    const row: CounterOperation = {
      ...input,
      id: newId(),
      status: 'DONE',
      createdAt: new Date().toISOString(),
    };
    this._operations.update((list) => [row, ...list]);
  }
}
