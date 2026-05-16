import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminEmployeeStoreService } from '../../services/admin-employee-store.service';

/** Dados ilustrativos para o painel (apenas desenho). */
const MOCK = {
  clients: 3842,
  employeesTotal: 127,
  accounts: 9102,
  newClientsMonth: 214,
  /** Barras semanais (altura relativa 0–100). */
  weeklyActivity: [38, 55, 48, 62, 58, 71, 66],
  weekLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  /** Conic %: particulares, empresas, premium (soma 100). */
  segmentShares: { retail: 58, business: 32, premium: 10 },
  /** Evolução mensal simulada (milhares €). */
  revenueTrend: [1.2, 1.35, 1.28, 1.52, 1.48, 1.67, 1.72, 1.81, 1.76, 1.94, 2.02, 2.08],
  monthLabels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
} as const;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  protected readonly auth = inject(AuthService);
  protected readonly employees = inject(AdminEmployeeStoreService);
  protected readonly sessionAsOf = new Date();
  protected readonly mock = MOCK;

  /** Partilhas para legenda do “donut” CSS. */
  protected readonly segmentLegend = [
    { key: 'retail' as const, label: 'Particulares', pct: MOCK.segmentShares.retail, color: 'rgb(139 92 246)' },
    { key: 'business' as const, label: 'Empresas', pct: MOCK.segmentShares.business, color: 'rgb(16 185 129)' },
    { key: 'premium' as const, label: 'Premium', pct: MOCK.segmentShares.premium, color: 'rgb(251 191 36)' },
  ];

  protected donutGradient(): string {
    const { retail, business, premium } = MOCK.segmentShares;
    const r = retail;
    const b = business;
    const p = premium;
    return `conic-gradient(
      rgb(139 92 246) 0 ${r}%,
      rgb(16 185 129) ${r}% ${r + b}%,
      rgb(251 191 36) ${r + b}% 100%
    )`;
  }

  protected maxTrend(): number {
    return Math.max(...MOCK.revenueTrend);
  }

  /** Polígono para preenchimento sob a curva (viewBox 0 0 100 100). */
  protected trendAreaPoints(): string {
    const t = MOCK.revenueTrend;
    const max = this.maxTrend();
    const n = t.length;
    const bottom = 100;
    const usable = 78;
    let pts = `0,${bottom} `;
    const denom = Math.max(n - 1, 1);
    t.forEach((v, i) => {
      const x = (i / denom) * 100;
      const y = bottom - (v / max) * usable;
      pts += `${x},${y} `;
    });
    pts += `100,${bottom}`;
    return pts;
  }

  /** Linha da tendência (viewBox 0 0 100 100). */
  protected trendLinePoints(): string {
    const t = MOCK.revenueTrend;
    const max = this.maxTrend();
    const n = t.length;
    const bottom = 100;
    const usable = 78;
    const denom = Math.max(n - 1, 1);
    return t
      .map((v, i) => {
        const x = (i / denom) * 100;
        const y = bottom - (v / max) * usable;
        return `${x},${y}`;
      })
      .join(' ');
  }

  protected trendDotTopPct(v: number): number {
    const max = this.maxTrend();
    const bottom = 100;
    const usable = 78;
    return bottom - (v / max) * usable;
  }
}
