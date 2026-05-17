import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ClientBankingStoreService } from '../../services/client-banking-store.service';

type OperationMode = 'TRANSFER' | 'DEPOSIT';

export interface BalanceDonutSlice {
  readonly path: string;
  readonly color: string;
  readonly label: string;
  readonly balance: number;
  readonly pct: number;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './client-dashboard.component.html',
})
export class ClientDashboardComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly auth = inject(AuthService);
  protected readonly banking = inject(ClientBankingStoreService);

  protected readonly operationMode = signal<OperationMode>('TRANSFER');
  protected readonly operationError = signal<string | null>(null);
  protected readonly operationSuccess = signal<string | null>(null);
  protected readonly accountMenuOpen = signal(false);

  protected readonly operationForm = this.fb.nonNullable.group({
    fromCardId: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    note: [''],
  });

  protected readonly cardOptions = this.banking.paymentCards;

  private static readonly donutGeom = { cx: 100, cy: 100, rOuter: 78, rInner: 52 } as const;
  private static readonly sliceColors = ['#059669', '#14b8a6', '#64748b', '#6366f1', '#d97706'] as const;

  /** Segmentos do donut: parte de cada conta no saldo total. */
  protected readonly balanceDonutSlices = computed((): BalanceDonutSlice[] => {
    const cards = this.banking.paymentCards();
    const total = cards.reduce((s, c) => s + c.balance, 0);
    if (cards.length === 0) {
      return [];
    }
    let t0 = 0;
    return cards.map((card, i) => {
      const frac = total > 0 ? card.balance / total : 1 / cards.length;
      const t1 = t0 + frac;
      const path = donutArcPath(ClientDashboardComponent.donutGeom, t0, t1);
      const color = ClientDashboardComponent.sliceColors[i % ClientDashboardComponent.sliceColors.length];
      const slice: BalanceDonutSlice = {
        path,
        color,
        label: card.cardNumberMasked,
        balance: card.balance,
        pct: frac * 100,
      };
      t0 = t1;
      return slice;
    });
  });

  /** Linha + área (SVG path) do fluxo acumulado dos movimentos recentes, do mais antigo ao mais recente. */
  protected readonly cashflowChart = computed(() => {
    const txs = [...this.banking.recentTransactions()].reverse();
    if (txs.length === 0) {
      return { line: '', area: '', minY: 0, maxY: 0 } as const;
    }
    let sum = 0;
    const yVals: number[] = [];
    for (const tx of txs) {
      sum += tx.amount;
      yVals.push(sum);
    }
    let minY = Math.min(0, ...yVals);
    let maxY = Math.max(0, ...yVals);
    const span = maxY - minY || 1;
    const pad = span * 0.12;
    minY -= pad;
    maxY += pad;
    const w = 100;
    const h = 44;
    const n = txs.length;
    const coords = yVals.map((y, i) => {
      const px = n === 1 ? w / 2 : (i / (n - 1)) * w;
      const py = h - ((y - minY) / (maxY - minY)) * h;
      return { px, py };
    });
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px.toFixed(2)} ${c.py.toFixed(2)}`)
      .join(' ');
    const area =
      `${line} L ${w.toFixed(2)} ${h.toFixed(2)} L 0 ${h.toFixed(2)} Z`;
    return { line, area, minY, maxY } as const;
  });

  constructor() {
    const first = this.banking.paymentCards()[0];
    if (first) {
      this.operationForm.controls.fromCardId.setValue(first.id);
    }
  }

  protected setMode(mode: OperationMode): void {
    this.operationMode.set(mode);
    this.operationError.set(null);
    this.operationSuccess.set(null);
  }

  protected selectedCardLabel(): string {
    const selectedId = this.operationForm.controls.fromCardId.value;
    const selected = this.cardOptions().find((opt) => opt.id === selectedId);
    return selected?.cardNumberMasked ?? 'Selecione o cartão';
  }

  protected toggleAccountMenu(): void {
    this.accountMenuOpen.update((open) => !open);
  }

  protected selectCard(id: string): void {
    this.operationForm.controls.fromCardId.setValue(id);
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:click')
  protected closeAccountMenuOnOutsideClick(): void {
    this.accountMenuOpen.set(false);
  }

  protected submitOperation(): void {
    this.operationError.set(null);
    this.operationSuccess.set(null);

    const mode = this.operationMode();
    const { fromCardId, amount, note } = this.operationForm.getRawValue();

    if (!fromCardId || !amount || amount <= 0) {
      this.operationError.set('Preencha os campos obrigatórios corretamente.');
      return;
    }

    if (!this.banking.hasRegisteredCard()) {
      this.operationError.set('Registe um cartão em Contas antes de fazer operações.');
      return;
    }

    if (mode === 'DEPOSIT') {
      const res = this.banking.depositOnCard(fromCardId, amount, note || undefined);
      if (!res.ok) {
        this.operationError.set(res.error);
        return;
      }
      this.operationSuccess.set('Depósito efetuado com sucesso.');
      this.operationForm.controls.amount.setValue(null);
      this.operationForm.controls.note.setValue('');
      return;
    }

    const res = this.banking.transferFromCard(fromCardId, amount, note || undefined);
    if (!res.ok) {
      this.operationError.set(res.error);
      return;
    }
    this.operationSuccess.set('Transferência efetuada com sucesso.');
    this.operationForm.controls.amount.setValue(null);
    this.operationForm.controls.note.setValue('');
  }
}

function donutArcPath(
  g: { cx: number; cy: number; rOuter: number; rInner: number },
  t0: number,
  t1: number,
): string {
  const angle = (u: number) => -Math.PI / 2 + u * 2 * Math.PI;
  const a0 = angle(t0);
  const a1 = angle(t1);
  const xo = (r: number, a: number) => g.cx + r * Math.cos(a);
  const yo = (r: number, a: number) => g.cy + r * Math.sin(a);
  const large = t1 - t0 > 0.5 ? 1 : 0;
  return [
    `M ${xo(g.rOuter, a0)} ${yo(g.rOuter, a0)}`,
    `A ${g.rOuter} ${g.rOuter} 0 ${large} 1 ${xo(g.rOuter, a1)} ${yo(g.rOuter, a1)}`,
    `L ${xo(g.rInner, a1)} ${yo(g.rInner, a1)}`,
    `A ${g.rInner} ${g.rInner} 0 ${large} 0 ${xo(g.rInner, a0)} ${yo(g.rInner, a0)}`,
    'Z',
  ].join(' ');
}
