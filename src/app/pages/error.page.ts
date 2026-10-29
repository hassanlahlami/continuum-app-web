import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiErrorStore } from '../errors/api-error.store';

interface ErrorCopy {
  icon: string;
  title: string;
  text: string;
  action: 'home' | 'retry';
}

/** Messages COM-11 : un 403 ne nomme pas la fonctionnalité manquante, un 404 ne distingue pas « inexistant » de « hors périmètre ». */
const COPY: Record<string, ErrorCopy> = {
  '403': { icon: 'lock', title: 'Accès refusé', text: "Vous n'avez pas accès à cette page.", action: 'home' },
  '404': { icon: 'search_off', title: 'Page introuvable', text: "Cette page n'existe pas ou n'est pas accessible.", action: 'home' },
  '500': { icon: 'error', title: 'Erreur inattendue', text: "Un incident est survenu. Réessayez ; s'il persiste, communiquez la référence au support.", action: 'retry' },
};

/**
 * COM-11 — Pages d'erreur (403, 404, 500). Message adapté, référence d'erreur (`traceId`) copiable
 * (dernière erreur d'API reçue), action unique : retour à l'accueil ou nouvel essai.
 */
@Component({
  selector: 'ct-error',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <section class="err" data-cy="error-page" [attr.data-status]="status()">
      <mat-icon class="big" aria-hidden="true">{{ copy().icon }}</mat-icon>
      <h1 data-cy="error-title">{{ copy().title }}</h1>
      <p data-cy="error-text">{{ copy().text }}</p>
      @if (traceId(); as ref) {
        <p class="ref">Référence : <code data-cy="error-ref">{{ ref }}</code>
          <button mat-icon-button type="button" (click)="copy_(ref)" aria-label="Copier la référence" data-cy="error-copy">
            <mat-icon>content_copy</mat-icon>
          </button>
        </p>
      }
      @if (copy().action === 'retry') {
        <button mat-flat-button type="button" (click)="retry()" data-cy="error-action">Réessayer</button>
      } @else {
        <a mat-flat-button routerLink="/" data-cy="error-action">Retour à l'accueil</a>
      }
    </section>
  `,
  styles: [
    `
      .err { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--ct-space-3); padding: var(--ct-space-6) var(--ct-space-4); }
      .big { font-size: 56px; height: 56px; width: 56px; color: var(--ct-color-muted); }
      .ref { color: var(--ct-color-muted); font-size: 0.85rem; }
      code { font-weight: 600; }
    `,
  ],
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly errors = inject(ApiErrorStore);
  readonly status = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('status') ?? String(this.route.snapshot.data['status'] ?? '404'))),
    { initialValue: '404' },
  );
  readonly copy = computed(() => COPY[this.status()] ?? COPY['404']);
  readonly traceId = computed(() => this.errors.error()?.traceId);

  copy_(ref: string): void {
    void navigator.clipboard?.writeText(ref);
  }

  retry(): void {
    window.history.length > 1 ? window.history.back() : window.location.assign('/');
  }
}
