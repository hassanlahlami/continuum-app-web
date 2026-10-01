import { Injectable, signal } from '@angular/core';

/** Erreur d'API normalisée (RFC 9457, §10.8) pour l'affichage avec référence (`traceId`). */
export interface ApiError {
  message: string;
  traceId?: string;
  code?: string;
  status?: number;
}

/** Dernière erreur d'API, affichée par la coquille (§1.1 : toute erreur montre une référence). */
@Injectable({ providedIn: 'root' })
export class ApiErrorStore {
  private readonly state = signal<ApiError | null>(null);
  readonly error = this.state.asReadonly();

  report(error: ApiError): void {
    this.state.set(error);
  }

  clear(): void {
    this.state.set(null);
  }
}
