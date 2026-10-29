import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { AvailableAction, Finding, HistoryEntry } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Détail d'un constat — la FRAP (archétype FICHE, §6/§8) : Fait, Critère, Cause, Conséquence, plus
 * statut, criticité et les actions décidées par le serveur (`availableActions`, §2.1.4). Le périmètre
 * (`finding.read`) et les actions viennent du serveur (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-finding-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
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
              <mat-chip disableRipple data-cy="finding-status" [attr.data-status]="f.status.code">{{ f.status.label }}</mat-chip>
              @if (f.criticality; as c) {
                <mat-chip disableRipple [attr.data-criticality]="c.code">{{ c.label }}</mat-chip>
              }
            </mat-chip-set>
            <dl class="info">
              @if (f.author; as a) {
                <dt>Auteur</dt>
                <dd>{{ a.displayName }}@if (a.positionLabel) { <span class="muted"> · {{ a.positionLabel }}</span> }</dd>
              }
              @if (f.riskFamilyCode) { <dt>Famille de risque</dt><dd><code>{{ f.riskFamilyCode }}</code></dd> }
              <dt>Source</dt><dd>{{ f.source === 'CCM' ? 'Contrôle continu' : 'Manuel' }}</dd>
            </dl>
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

        @if (f.evidences?.length) {
          <mat-card appearance="outlined" class="block" data-cy="finding-evidences">
            <mat-card-header><mat-card-title>Preuves ({{ f.evidences?.length }})</mat-card-title></mat-card-header>
            <mat-card-content>
              <ul class="files">
                @for (att of f.evidences; track att.id) {
                  <li>
                    <mat-icon aria-hidden="true">description</mat-icon>
                    <span class="file-name">{{ att.fileName }}</span>
                    @if (att.category; as cat) { <span class="badge">{{ cat.label }}</span> }
                    <span class="muted">{{ fileSize(att.size) }} · {{ att.uploadedAt | date: 'dd/MM/yyyy' }}@if (att.uploadedBy; as u) { · {{ u.displayName }} }</span>
                  </li>
                }
              </ul>
            </mat-card-content>
          </mat-card>
        }

        @if (f.reviewComments?.length) {
          <mat-card appearance="outlined" class="block" data-cy="finding-reviews">
            <mat-card-header><mat-card-title>Commentaires de revue</mat-card-title></mat-card-header>
            <mat-card-content>
              <ul class="reviews">
                @for (rc of f.reviewComments; track $index) {
                  <li>
                    <div class="rc-head">
                      <strong>{{ rc.author?.displayName ?? '—' }}</strong>
                      @if (rc.field) { <span class="badge">{{ rc.field }}</span> }
                      @if (rc.resolved) {
                        <span class="badge ok">Résolu</span>
                      } @else {
                        <span class="badge todo">À traiter</span>
                      }
                      <span class="muted">{{ rc.at | date: 'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <p>{{ rc.comment }}</p>
                  </li>
                }
              </ul>
            </mat-card-content>
          </mat-card>
        }

        @if (history().length) {
          <mat-card appearance="outlined" class="block" data-cy="finding-history">
            <mat-card-header><mat-card-title>Historique</mat-card-title></mat-card-header>
            <mat-card-content>
              <ul class="reviews">
                @for (h of history(); track $index) {
                  <li>
                    <div class="rc-head">
                      <strong>{{ h.event.label }}</strong>
                      @if (h.toStatus; as t) { <span class="badge">{{ h.fromStatus ? h.fromStatus.label + ' → ' : '' }}{{ t.label }}</span> }
                      <span class="muted">{{ h.actor.displayName }} · {{ h.at | date: 'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    @if (h.comment) { <p>{{ h.comment }}</p> }
                  </li>
                }
              </ul>
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      code { font-family: var(--ct-font-mono); }
      .info { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-1) var(--ct-space-4); margin: 0 0 var(--ct-space-3); }
      .info dt { color: var(--ct-color-muted); } .info dd { margin: 0; font-weight: 600; }
      .muted { color: var(--ct-color-muted); font-weight: 400; }
      .frap { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-2) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .frap dt { color: var(--ct-color-muted); font-weight: 600; } .frap dd { margin: 0; max-width: 80ch; }
      .error { color: var(--ct-red-700); }
      .files { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-2); }
      .files li { display: flex; align-items: center; gap: var(--ct-space-2); flex-wrap: wrap; }
      .files mat-icon { color: var(--ct-color-muted); font-size: 20px; height: 20px; width: 20px; }
      .file-name { font-weight: 600; }
      .reviews { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-3); }
      .reviews li { border-left: 2px solid var(--ct-color-border); padding-left: var(--ct-space-3); }
      .reviews p { margin: var(--ct-space-1) 0 0; max-width: 80ch; }
      .rc-head { display: flex; align-items: center; gap: var(--ct-space-2); flex-wrap: wrap; }
      .badge { font-size: 0.72rem; padding: 1px 8px; border-radius: var(--ct-radius-pill); background: var(--ct-color-surface-alt); color: var(--ct-color-muted); }
      .badge.ok { background: var(--ct-green-50); color: var(--ct-green-600); }
      .badge.todo { background: var(--ct-amber-50); color: var(--ct-amber-700); }
    `,
  ],
})
export class FindingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(FindingsFacade);
  readonly finding = signal<Finding | null>(null);
  readonly history = signal<HistoryEntry[]>([]);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  missionId = '';

  ngOnInit(): void {
    this.missionId = this.route.snapshot.paramMap.get('missionId') ?? '';
    const findingId = this.route.snapshot.paramMap.get('findingId');
    if (this.missionId && findingId) {
      this.facade.get(this.missionId, findingId).subscribe((f) => this.finding.set(f));
      this.facade.history(this.missionId, findingId).subscribe({ next: (h) => this.history.set(h), error: () => this.history.set([]) });
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

  /** Taille de fichier lisible (o / Ko / Mo). */
  fileSize(bytes?: number): string {
    if (bytes == null) {
      return '—';
    }
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} Ko`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
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
