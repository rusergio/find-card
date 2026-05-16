import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { BankEmployee } from '../models/bank-employee.model';

const STORAGE_KEY = 'bm_admin_bank_employees';

function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class AdminEmployeeStoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _employees = signal<BankEmployee[]>([]);

  readonly employees = this._employees.asReadonly();
  readonly count = computed(() => this._employees().length);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  add(input: { fullName: string; email: string; workPost?: string }): BankEmployee {
    const row: BankEmployee = {
      id: newId(),
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      workPost: input.workPost?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this._employees.update((list) => [...list, row]);
    this.persist();
    return row;
  }

  remove(id: string): void {
    this._employees.update((list) => list.filter((e) => e.id !== id));
    this.persist();
  }

  getById(id: string): BankEmployee | undefined {
    return this._employees().find((e) => e.id === id);
  }

  emailExists(email: string): boolean {
    const e = email.trim().toLowerCase();
    return this._employees().some((x) => x.email === e);
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }
      const rows = parsed.filter(isBankEmployeeRow);
      this._employees.set(rows);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._employees()));
  }
}

function isBankEmployeeRow(v: unknown): v is BankEmployee {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const o = v as Record<string, unknown>;
  return (
    typeof o['id'] === 'string' &&
    typeof o['fullName'] === 'string' &&
    typeof o['email'] === 'string' &&
    typeof o['createdAt'] === 'string'
  );
}
