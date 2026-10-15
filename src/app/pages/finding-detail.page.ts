import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { AvailableAction, Finding } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Détail d'un constat — la FRAP (archétype FICHE, §6/§8) : Fait, Critère, Cause, Conséquence, plus
 * statut, criticité et les actions décidées par le serveur (`availableActions`, §2.1.4). Le périmètre
 * (`finding.read`) et les actions viennent du serveur (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-finding-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <a mat-button [routerLink]="['/missions', missionId]"><mat-icon>arrow_back</mat-icon> Mission</a>
      @if (finding(); as f) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title>{{ f.title }}</mat-card-title>
            <mat-card-subtitle>
              <code>{{ f.reference }}</code>
              @if (f.criticality; as c) { · Criticité : {{ c.label }} }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple data-cy="finding-status">{{ f.status.label }}</mat-chip>
            </mat-chip-set>
            <dl class="frap">
              <dt>Fait</dt><dd>{{ f.fact || '—' }}</dd>
              <dt>Critère</dt><dd>{{ f.criterion || '—' }}</dd>
              <dt>Cause</dt><dd>{{ f.cause || '—' }}</dd>
              <dt>Conséquence</dt><dd>{{ f.consequence || '—' }}</dd>
            </dl>
            @if (error(); as e) {
              <p class="error" role="alert" data-cy="finding-action-error">{{ e }}</p>
            }
          </mat-card-content>
          @if (f.availableActions?.length) {
            <mat-card-actions align="end">
              @for (action of f.availableActions; track action.code) {
                @if (action.style === 'primary') {
                  <button mat-flat-button color="primary" [attr.data-cy]="'finding-action-' + action.code"
                          [disabled]="busy()" (click)="run(f, action)">{{ action.label }}</button>
                } @else {
                  <button mat-stroked-button [attr.data-cy]="'finding-action-' + action.code"
                          [disabled]="busy()" (click)="run(f, action)">{{ action.label }}</button>
                }
              }
            </mat-card-actions>
          }
        </mat-card>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      code { font-family: var(--ct-font-mono); }
      .frap { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-2) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .frap dt { color: var(--ct-color-muted); font-weight: 600; } .frap dd { margin: 0; }
      .error { color: var(--ct-red-700); }
    `,
  ],
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
        return 'Action non autorisée sur ce constat.';
      case 409:
        return err.error?.detail ?? 'Action en conflit (séparation des tâches ou constat modifié).';
      case 404:
        return 'Constat introuvable.';
      default:
        return "Échec de l'action. Réessayez.";
    }
  }
}
