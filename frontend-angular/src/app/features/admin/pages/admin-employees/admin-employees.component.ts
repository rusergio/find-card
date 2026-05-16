import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminEmployeeStoreService } from '../../services/admin-employee-store.service';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-employees.component.html',
})
export class AdminEmployeesComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(AdminEmployeeStoreService);

  protected readonly formMessage = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly deleteTargetId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    workPost: [''],
  });

  protected submit(): void {
    this.formMessage.set(null);
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fullName, email, workPost } = this.form.getRawValue();
    if (this.store.emailExists(email)) {
      this.formError.set('Já existe um empregado com este email.');
      return;
    }
    this.store.add({
      fullName,
      email,
      workPost: workPost.trim() || undefined,
    });
    this.form.reset({ fullName: '', email: '', workPost: '' });
    this.formMessage.set('Empregado registado com sucesso.');
  }

  protected confirmDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  protected cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  protected executeDelete(): void {
    const id = this.deleteTargetId();
    if (id) {
      this.store.remove(id);
    }
    this.deleteTargetId.set(null);
    this.formMessage.set(null);
  }
}
