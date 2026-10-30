import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CcmRun } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';

/**
 * Détail d'une exécution CCM (§5) : population testée, exceptions, durée, source de données, paramètres
 * utilisés et cause d'échec. Lecture seule (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-ccm-run-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      @if (run(); as r) {
        <a mat-button [routerLink]="['/ccm/controls', r.controlId]" data-cy="ccm-run-back">
          <mat-icon aria-hidden="true">arrow_back</mat-icon> Fiche contrôle
        </a>
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title data-cy="ccm-run-control">{{ r.controlLabel ?? 'Exécution' }}</mat-card-title>
            <mat-card-subtitle>{{ r.startedAt | date: 'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple data-cy="ccm-run-detail-status" [attr.data-status]="r.status">{{ statusLabel(r.status) }}</mat-chip>
            </mat-chip-set>
            <dl class="meta">
              @if (r.trigger) {
                <dt>Déclencheur</dt><dd data-cy="ccm-run-trigger">{{ triggerLabel(r.trigger) }}</dd>
              }
              @if (r.finishedAt) {
                <dt>Fin</dt><dd>{{ r.finishedAt | date: 'medium' }}</dd>
                <dt>Durée</dt><dd data-cy="ccm-run-duration">{{ duration(r) }}</dd>
              }
              @if (r.populationSize != null) {
                <dt>Population testée</dt><dd data-cy="ccm-run-population">{{ r.populationSize }}</dd>
              }
              @if (r.exceptionsCount != null) {
                <dt>Exceptions</dt><dd data-cy="ccm-run-exceptions">{{ r.exceptionsCount }}</dd>
              }
              @if (r.dataSource) {
                <dt>Source de données</dt><dd data-cy="ccm-run-source">{{ r.dataSource }}</dd>
              }
              @if (r.parametersUsed; as p) {
                <dt>Paramètres utilisés</dt><dd><code data-cy="ccm-run-params">{{ stringify(p) }}</code></dd>
              }
            </dl>
            @if (r.problem; as pb) {
              <p class="problem" data-cy="ccm-run-problem" role="alert">{{ pb.title }}{{ pb.detail ? ' — ' + pb.detail : '' }}</p>
            }
          </mat-card-content>
        </mat-card>
      } @else if (notFound()) {
        <a mat-button routerLink="/ccm/controls">Bibliothèque de contrôles</a>
        <p data-cy="ccm-run-notfound">Exécution introuvable.</p>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      code { font-family: var(--ct-font-mono); }
      .meta { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-1) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .meta dt { color: var(--ct-color-muted); }
      .meta dd { margin: 0; }
      .problem { color: var(--ct-red-700); }
      mat-chip[data-status='SUCCEEDED'] { --mdc-chip-elevated-container-color: var(--ct-green-50); color: var(--ct-green-600); }
      mat-chip[data-status='FAILED'] { --mdc-chip-elevated-container-color: var(--ct-red-50); color: var(--ct-red-700); }
      mat-chip[data-status='RUNNING'] { --mdc-chip-elevated-container-color: var(--ct-color-primary-soft); color: var(--ct-color-primary); }
    `,
  ],
})
export class CcmRunDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CcmFacade);
  readonly run = signal<CcmRun | null>(null);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('runId') ?? '';
    if (!id) {
      this.notFound.set(true);
      return;
    }
    this.facade.getRun(id).subscribe({
      next: (r) => this.run.set(r),
      error: () => this.notFound.set(true),
    });
  }

  statusLabel(s: CcmRun.StatusEnum): string {
    return s === 'SUCCEEDED' ? 'Réussie' : s === 'FAILED' ? 'En échec' : 'En cours';
  }

  triggerLabel(t: CcmRun.TriggerEnum): string {
    return t === 'SCHEDULE' ? 'Planifié' : t === 'EVENT' ? 'Événement' : 'Manuel';
  }

  duration(r: CcmRun): string {
    if (!r.finishedAt) return '—';
    const sec = Math.max(0, Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000));
    return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min ${sec % 60} s`;
  }

  stringify(v: unknown): string {
    return JSON.stringify(v);
  }
}
