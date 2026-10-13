import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvailableAction, CcmException } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';

/**
 * Détail d'une exception CCM (§5.3, D34) : résumé, contrôle, criticité, enregistrement source du CBS, et
 * les <strong>actions de triage</strong> décidées par le serveur ({@code availableActions} — retenir /
 * écarter / affecter / rouvrir). Écarter exige une justification. Une exception <em>retenue</em> peut être
 * convertie en constat candidat dans une mission (§5.3). Le front n'invente aucune règle (D32).
 */
@Component({
  selector: 'ct-ccm-exception-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <a routerLink="/ccm">← Flux d'exceptions</a>
      @if (exc(); as e) {
        <header>
          <h1 data-cy="ccm-exc-summary">{{ e.summary || e.controlCode }}</h1>
          <p>
            <code>{{ e.controlCode }}</code> ·
            <span data-cy="ccm-exc-status">{{ e.status.label }}</span>
            @if (e.criticality; as c) { · Criticité : {{ c.label }} }
            @if (e.unit; as u) { · Unité : {{ u.label }} }
          </p>
          <p>Détectée le {{ e.detectedAt }}</p>
        </header>

        @if (e.sourceRecord) {
          <dl data-cy="ccm-source-record">
            @for (entry of sourceEntries(e); track entry.key) {
              <dt>{{ entry.key }}</dt><dd>{{ entry.value }}</dd>
            }
          </dl>
        }
        @if (e.dismissalJustification) {
          <p data-cy="ccm-exc-justification">Motif d'écart : {{ e.dismissalJustification }}</p>
        }
        @if (e.findingId) {
          <p data-cy="ccm-exc-finding">Converti en constat : <code>{{ e.findingId }}</code></p>
        }

        @if (error(); as msg) {
          <p class="error" role="alert" data-cy="ccm-action-error">{{ msg }}</p>
        }

        <label>Justification (écart)
          <textarea #justif data-cy="ccm-justification" rows="2"></textarea>
        </label>

        @if (e.availableActions?.length) {
          <nav class="actions" aria-label="Actions de triage">
            @for (action of e.availableActions; track action.code) {
              <button
                type="button"
                [attr.data-cy]="'ccm-action-' + action.code"
                [class.primary]="action.style === 'primary'"
                [disabled]="busy()"
                (click)="run(e, action, justif.value)"
              >{{ action.label }}</button>
            }
          </nav>
        }

        @if (e.status.code === 'RETAINED') {
          <div class="convert" data-cy="ccm-convert-box">
            <label>Mission d'accueil
              <input #mission data-cy="ccm-convert-mission" [value]="defaultMissionId" />
            </label>
            <button type="button" data-cy="ccm-convert" [disabled]="busy()" (click)="convert(e, mission.value)">
              Convertir en constat
            </button>
            @if (convertedRoute(); as r) {
              <p data-cy="ccm-converted">Constat créé : <a [routerLink]="[r]">voir</a></p>
            }
          </div>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmExceptionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CcmFacade);
  readonly exc = signal<CcmException | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly convertedRoute = signal<string | null>(null);
  /** Mission de surveillance continue de démonstration (§5.5) — pré-remplie pour faciliter le triage. */
  readonly defaultMissionId = 'f1111111-1111-1111-1111-111111111101';
  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('exceptionId') ?? '';
    if (this.id) {
      this.facade.getException(this.id).subscribe((e) => this.exc.set(e));
    }
  }

  sourceEntries(e: CcmException): { key: string; value: string }[] {
    return e.sourceRecord
      ? Object.entries(e.sourceRecord).map(([key, value]) => ({ key, value: String(value) }))
      : [];
  }

  /** Exécute une action de triage décidée par le serveur ; écarter envoie la justification saisie. */
  run(exc: CcmException, action: AvailableAction, justification: string): void {
    this.busy.set(true);
    this.error.set(null);
    const comment = action.code === 'dismiss' ? justification : undefined;
    this.facade.performAction(exc.id, action.code, comment).subscribe({
      next: (updated) => {
        this.exc.set(updated);
        this.busy.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.messageFor(err));
        this.busy.set(false);
      },
    });
  }

  convert(exc: CcmException, missionId: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.facade.convert(exc.id, missionId).subscribe({
      next: (result) => {
        this.convertedRoute.set(result.route ?? '/missions');
        this.facade.getException(exc.id).subscribe((e) => this.exc.set(e));
        this.busy.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.messageFor(err));
        this.busy.set(false);
      },
    });
  }

  private messageFor(err: HttpErrorResponse): string {
    switch (err.status) {
      case 403:
        return 'Action non autorisée sur cette exception.';
      case 409:
        return err.error?.detail ?? 'Action en conflit (état incompatible ou déjà traitée).';
      case 422:
        return err.error?.detail ?? 'Justification requise pour écarter.';
      case 404:
        return 'Exception introuvable.';
      default:
        return "Échec de l'action. Réessayez.";
    }
  }
}
