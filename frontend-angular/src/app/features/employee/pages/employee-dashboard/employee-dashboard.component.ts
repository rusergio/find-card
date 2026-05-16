import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import type { CounterOperationType } from '../../models/counter-operation.model';
import { EmployeeOperationsStoreService } from '../../services/employee-operations-store.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './employee-dashboard.component.html',
})
export class EmployeeDashboardComponent {
  protected readonly auth = inject(AuthService);
  protected readonly ops = inject(EmployeeOperationsStoreService);
  protected readonly now = new Date();
  protected readonly recentOps = computed(() => this.ops.operations().slice(0, 6));

  protected typeLabel(type: CounterOperationType): string {
    switch (type) {
      case 'DEPOSIT':
        return 'Depósito';
      case 'WITHDRAWAL':
        return 'Levantamento';
      case 'TRANSFER':
        return 'Transferência';
      default:
        return type;
    }
  }

  protected typePillClass(type: CounterOperationType): string {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-sky-100 text-sky-700';
      case 'WITHDRAWAL':
        return 'bg-amber-100 text-amber-700';
      case 'TRANSFER':
        return 'bg-violet-100 text-violet-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}
