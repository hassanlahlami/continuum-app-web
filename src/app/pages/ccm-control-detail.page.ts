import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CcmControl, CcmRun } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_CATEGORY_LABELS, CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Fiche d'un contrôle CCM (§5) : règle, référence normative, jeu de données, paramètres métier (définitions
 * + valeurs courantes), planification et santé. Lecture seule (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-ccm-control-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <a mat-button routerLink="/ccm/controls"><mat-icon>arrow_back</mat-icon> Bibliothèque de contrôles</a>
      @if (control(); as c) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title data-cy="ccm-control-label">{{ c.label }}</mat-card-title>
            <mat-card-subtitle>
              <code>{{ c.code }}</code> · {{ categoryLabel(c.category) }} ·
              <span data-cy="ccm-control-active">{{ c.active ? 'Activé' : 'Désactivé' }}</span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple data-cy="ccm-control-health" [attr.data-health]="c.health">
                {{ healthLabel(c.health) }}
              </mat-chip>
            </mat-chip-set>
            @if (c.description) {
              <p data-cy="ccm-control-description">{{ c.description }}</p>
            }
            <dl class="meta">
              @if (c.normativeReference) {
                <dt>Référence normative</dt><dd data-cy="ccm-control-normative">{{ c.normativeReference }}</dd>
              }
              @if (c.dataset) {
                <dt>Jeu de données</dt><dd data-cy="ccm-control-dataset">{{ c.dataset }}</dd>
              }
              @if (c.lastRunAt) {
                <dt>Dernière exécution</dt><dd>{{ c.lastRunAt }}</dd>
              }
              @if (c.nextRunAt) {
                <dt>Prochaine exécution</dt><dd>{{ c.nextRunAt }}</dd>
              }
              @if (c.exceptionRate != null) {
                <dt>Taux d'exceptions</dt><dd>{{ c.exceptionRate }}</dd>
              }
            </dl>
            @if (c.settings?.schedule; as sch) {
              <p data-cy="ccm-control-schedule">
                Planification : {{ scheduleLabel(sch.mode) }}{{ sch.cron ? ' (' + sch.cron + ')' : '' }}
              </p>
            }
          </mat-card-content>
        </mat-card>

        @if (c.parameterDefinitions?.length) {
          <mat-card appearance="outlined" class="block">
            <mat-card-header><mat-card-title>Paramètres métier</mat-card-title></mat-card-header>
            <table mat-table [dataSource]="c.parameterDefinitions ?? []" data-cy="ccm-control-parameters">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Paramètre</th>
                <td mat-cell *matCellDef="let param">{{ param.label || param.name }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let param">{{ param.type }}</td>
              </ng-container>
              <ng-container matColumnDef="value">
                <th mat-header-cell *matHeaderCellDef>Valeur</th>
                <td mat-cell *matCellDef="let param">{{ parameterValue(c, param.name) }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="paramColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: paramColumns" data-cy="ccm-param-row"></tr>
            </table>
          </mat-card>
        }

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Exécutions récentes</mat-card-title></mat-card-header>
          @if (runs().length) {
            <table mat-table [dataSource]="runs()" data-cy="ccm-runs-table">
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let r">
                  <mat-chip-set><mat-chip disableRipple [attr.data-status]="r.status" data-cy="ccm-run-status">{{ runStatusLabel(r.status) }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <ng-container matColumnDef="trigger">
                <th mat-header-cell *matHeaderCellDef>Déclencheur</th>
                <td mat-cell *matCellDef="let r">{{ r.trigger ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="startedAt">
                <th mat-header-cell *matHeaderCellDef>Début</th>
                <td mat-cell *matCellDef="let r">{{ r.startedAt }}</td>
              </ng-container>
              <ng-container matColumnDef="exceptions">
                <th mat-header-cell *matHeaderCellDef>Exceptions</th>
                <td mat-cell *matCellDef="let r">{{ r.exceptionsCount ?? '—' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="runColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: runColumns" data-cy="ccm-run-row"></tr>
            </table>
          } @else {
            <mat-card-content><p data-cy="ccm-runs-empty">Aucune exécution historisée.</p></mat-card-content>
          }
        </mat-card>
      } @else if (notFound()) {
        <p data-cy="ccm-control-notfound">Contrôle introuvable.</p>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      table[mat-table] { width: 100%; background: transparent; }
      code { font-family: var(--ct-font-mono); }
      .meta { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-1) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .meta dt { color: var(--ct-color-muted); }
      .meta dd { margin: 0; }
      mat-chip[data-health='OK'] { --mdc-chip-elevated-container-color: var(--ct-green-50); color: var(--ct-green-600); }
      mat-chip[data-health='FAILING'] { --mdc-chip-elevated-container-color: var(--ct-red-50); color: var(--ct-red-700); }
      mat-chip[data-health='DRIFT'] { --mdc-chip-elevated-container-color: var(--ct-amber-50); color: var(--ct-amber-700); }
      mat-chip[data-health='NEVER_RUN'] { --mdc-chip-elevated-container-color: var(--ct-color-surface-alt); color: var(--ct-color-muted); }
      mat-chip[data-status='SUCCEEDED'] { --mdc-chip-elevated-container-color: var(--ct-green-50); color: var(--ct-green-600); }
      mat-chip[data-status='FAILED'] { --mdc-chip-elevated-container-color: var(--ct-red-50); color: var(--ct-red-700); }
      mat-chip[data-status='RUNNING'] { --mdc-chip-elevated-container-color: var(--ct-color-primary-soft); color: var(--ct-color-primary); }
    `,
  ],
})
export class CcmControlDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CcmFacade);
  readonly control = signal<CcmControl | null>(null);
  readonly runs = signal<CcmRun[]>([]);
  readonly notFound = signal(false);
  readonly paramColumns = ['name', 'type', 'value'];
  readonly runColumns = ['status', 'trigger', 'startedAt', 'exceptions'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('controlId') ?? '';
    if (id) {
      this.facade.getControl(id).subscribe({
        next: (c) => this.control.set(c),
        error: () => this.notFound.set(true),
      });
      this.facade.listControlRuns(id).subscribe((p) => this.runs.set(p.items));
    }
  }

  runStatusLabel(status: CcmRun.StatusEnum): string {
    return status === 'SUCCEEDED' ? 'Réussie' : status === 'FAILED' ? 'En échec' : 'En cours';
  }

  /** Valeur courante d'un paramètre (settings) sinon sa valeur par défaut (définition). */
  parameterValue(c: CcmControl, name: string): string {
    const current = c.settings?.parameters?.[name];
    if (current !== undefined && current !== null) {
      return Array.isArray(current) ? current.join(', ') : String(current);
    }
    const def = c.parameterDefinitions?.find((p) => p.name === name)?.default;
    return def != null ? String(def) : '—';
  }

  categoryLabel(c: CcmControl.CategoryEnum): string {
    return CCM_CATEGORY_LABELS[c] ?? c;
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }

  scheduleLabel(mode?: string): string {
    return mode === 'CRON' ? 'Planifiée' : mode === 'ON_EVENT' ? 'Sur événement' : '—';
  }
}
