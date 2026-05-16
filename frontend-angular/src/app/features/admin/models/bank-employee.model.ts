/** Colaborador operacional (ex.: caixa) — alinhar com entidade Java quando existir API. */
export interface BankEmployee {
  id: string;
  fullName: string;
  email: string;
  /** Ex.: Caixa, Balcão principal */
  workPost?: string;
  createdAt: string;
}
