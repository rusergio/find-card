export type CounterOperationType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export interface CounterOperation {
  id: string;
  customerName: string;
  customerIban: string;
  amount: number;
  type: CounterOperationType;
  note?: string;
  status: 'DONE';
  createdAt: string;
}
