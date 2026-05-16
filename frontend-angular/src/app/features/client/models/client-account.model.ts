export interface ClientAccount {
  id: string;
  iban: string;
  label: string;
  balance: number;
  currency: 'EUR';
}

export interface ClientTransaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  bookedAt: string;
  kind: 'credit' | 'debit';
}
