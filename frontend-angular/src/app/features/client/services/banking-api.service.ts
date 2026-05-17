import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, throwError, type Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

const jsonHeaders = new HttpHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' });

export interface ApiAccount {
  id: number;
  accountNumber: string;
  balance: number;
  currency: string;
  createdAt?: string;
}

export interface ApiPaymentCard {
  id: number;
  holderName: string;
  cardNumberMasked: string;
  expiry: string;
  createdAt?: string;
}

export interface RegisterPaymentCardBody {
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

@Injectable({ providedIn: 'root' })
export class BankingApiService {
  private readonly http = inject(HttpClient);

  listAccounts(): Observable<ApiAccount[]> {
    return this.http.get<ApiAccount[]>(`${environment.apiBaseUrl}/accounts`, { headers: jsonHeaders }).pipe(
      catchError((err) => throwError(() => formatBankingError(err))),
    );
  }

  listPaymentCards(): Observable<ApiPaymentCard[]> {
    return this.http
      .get<ApiPaymentCard[]>(`${environment.apiBaseUrl}/payment-cards`, { headers: jsonHeaders })
      .pipe(catchError((err) => throwError(() => formatBankingError(err))));
  }

  registerPaymentCard(body: RegisterPaymentCardBody): Observable<ApiPaymentCard> {
    return this.http
      .post<ApiPaymentCard>(`${environment.apiBaseUrl}/payment-cards`, body, { headers: jsonHeaders })
      .pipe(catchError((err) => throwError(() => formatBankingError(err))));
  }
}

function formatBankingError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return err.message || `Erro HTTP ${err.status}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Não foi possível comunicar com o servidor.';
}
