import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CounterOperation, CounterOperationType } from '../../models/counter-operation.model';
import { EmployeeOperationsStoreService } from '../../services/employee-operations-store.service';

@Component({
  selector: 'app-employee-operations',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './employee-operations.component.html',
})
export class EmployeeOperationsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly ops = inject(EmployeeOperationsStoreService);
  protected readonly activeFilter = signal<'ALL' | CounterOperationType>('ALL');

  protected readonly ok = signal<string | null>(null);

  protected readonly typeOptions: { value: CounterOperationType; label: string }[] = [
    { value: 'DEPOSIT', label: 'Conta à ordem' },
    { value: 'WITHDRAWAL', label: 'Conta poupança' },
    { value: 'TRANSFER', label: 'Conta jovem' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    customerIban: ['', [Validators.required, Validators.minLength(10)]],
    type: ['DEPOSIT' as CounterOperationType, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    note: [''],
  });

  protected readonly filteredOperations = computed(() => {
    const filter = this.activeFilter();
    const all = this.ops.operations();
    if (filter === 'ALL') {
      return all;
    }
    return all.filter((row) => row.type === filter);
  });

  protected readonly filteredTotal = computed(() =>
    this.filteredOperations().reduce((sum, row) => sum + row.amount, 0),
  );

  protected readonly grandTotal = computed(() =>
    this.ops.operations().reduce((sum, row) => sum + row.amount, 0),
  );

  protected submit(): void {
    this.ok.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { customerName, customerIban, type, amount, note } = this.form.getRawValue();
    this.ops.add({
      customerName,
      customerIban,
      type,
      amount: Number(amount),
      note: note.trim() || undefined,
    });
    this.form.reset({
      customerName: '',
      customerIban: '',
      type: 'DEPOSIT',
      amount: 0,
      note: '',
    });
    this.ok.set('Pedido de abertura de conta registado com sucesso.');
  }

  protected setFilter(value: 'ALL' | CounterOperationType): void {
    this.activeFilter.set(value);
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

  protected typeLabel(type: CounterOperationType): string {
    switch (type) {
      case 'DEPOSIT':
        return 'Conta à ordem';
      case 'WITHDRAWAL':
        return 'Conta poupança';
      case 'TRANSFER':
        return 'Conta jovem';
      default:
        return type;
    }
  }

  protected shortIban(value: string): string {
    const clean = value.replace(/\s/g, '');
    return clean.length > 8 ? `${clean.slice(0, 4)}...${clean.slice(-4)}` : clean;
  }

  protected activeFilterLabel(): string {
    const filter = this.activeFilter();
    if (filter === 'ALL') {
      return 'geral';
    }
    return `de ${this.typeLabel(filter)}`;
  }

  protected trackById(_: number, row: CounterOperation): string {
    return row.id;
  }
}
