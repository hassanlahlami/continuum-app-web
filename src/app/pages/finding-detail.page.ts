import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvailableAction, Finding } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Détail d'un constat — la FRAP (archétype FICHE, §6/§8) : Fait, Critère, Cause, Conséquence, plus
 * statut, criticité et les actions décidées par le serveur (`availableActions`, §2.1.4). Le périmètre
 * (`finding.read`) et les actions viennent du serveur (D32) ; le front n'invente aucune règle.
 */
@Component({
  selector: 'ct-finding-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <a [routerLink]="['/missions', missionId]">← Mission</a>
      @if (finding(); as f) {
        <header>
          <h1>{{ f.title }}</h1>
          <p>
            <code>{{ f.reference }}</code> · <span data-cy="finding-status">{{ f.status.label }}</span>
            @if (f.criticality; as c) { · Criticité : {{ c.label }} }
          </p>
        </header>
        <dl>
          <dt>Fait</dt><dd>{{ f.fact || '—' }}</dd>
          <dt>Critère</dt><dd>{{ f.criterion || '—' }}</dd>
          <dt>Cause</dt><dd>{{ f.cause || '—' }}</dd>
          <dt>Conséquence</dt><dd>{{ f.consequence || '—' }}</dd>
        </dl>

        @if (error(); as e) {
          <p class="error" role="alert" data-cy="finding-action-error">{{ e }}</p>
        }
        @if (f.availableActions?.length) {
          <nav class="actions" aria-label="Actions sur le constat">
            @for (action of f.availableActions; track action.code) {
              <button
                type="button"
                [attr.data-cy]="'finding-action-' + action.code"
                [class.primary]="action.style === 'primary'"
                [disabled]="busy()"
                (click)="run(f, action)"
              >
                {{ action.label }}
              </button>
            }
          </nav>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class FindingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(FindingsFacade);
  readonly finding = signal<Finding | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  missionId = '';

  ngOnInit(): void {
    this.missionId = this.route.snapshot.paramMap.get('missionId') ?? '';
    const findingId = this.route.snapshot.paramMap.get('findingId');
    if (this.missionId && findingId) {
      this.facade.get(this.missionId, findingId).subscribe((f) => this.finding.set(f));
    }
  }

  /** Exécute une action décidée par le serveur (§2.1.4) ; le serveur renvoie le constat à jour. */
  run(finding: Finding, action: AvailableAction): void {
    this.busy.set(true);
    this.error.set(null);
    this.facade.performAction(this.missionId, finding.id, action.code, finding.meta.version).subscribe({
      next: (updated) => {
        this.finding.set(updated);
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
        return "Action non autorisée sur ce constat.";
      case 409:
        return err.error?.detail ?? 'Action en conflit (séparation des tâches ou constat modifié).';
      case 404:
        return 'Constat introuvable.';
      default:
        return "Échec de l'action. Réessayez.";
    }
  }
}
