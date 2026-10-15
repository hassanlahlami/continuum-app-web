import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { CcmControl, CcmOverview } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Vue d'ensemble du contrôle continu (cockpit CCM, §5) : indicateurs, tendance des détections et santé
 * par contrôle. Le serveur agrège dans le périmètre {@code ccm.read} (D32) ; lecture seule. Composants
 * Material (tuiles mat-card, mat-table) habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-ccm-overview',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule],
  template: `
    <section>
      <header class="page-head">
        <h1>Contrôle continu</h1>
        <span class="head-actions">
          <a mat-stroked-button routerLink="/ccm" data-cy="ccm-exceptions-link">Flux d'exceptions</a>
          <a mat-stroked-button routerLink="/ccm/controls" data-cy="ccm-controls-link">Bibliothèque</a>
        </span>
      </header>

      @if (overview(); as o) {
        <div class="kpis" data-cy="ccm-kpis">
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-exceptions-to-triage">
            <strong>{{ o.exceptionsToTriage ?? 0 }}</strong><span>À trier</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-open-exceptions">
            <strong>{{ o.openExceptions ?? 0 }}</strong><span>Exceptions ouvertes</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-active-controls">
            <strong>{{ o.activeControls ?? 0 }}</strong><span>Contrôles actifs</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-failing-controls" [class.alert]="(o.failingControls ?? 0) > 0">
            <strong>{{ o.failingControls ?? 0 }}</strong><span>En échec</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-drifting-controls" [class.alert]="(o.driftingControls ?? 0) > 0">
            <strong>{{ o.driftingControls ?? 0 }}</strong><span>En dérive</span>
          </mat-card>
        </div>

        @if (trend().length) {
          <mat-card appearance="outlined" class="block">
            <mat-card-header><mat-card-title>Tendance des détections</mat-card-title></mat-card-header>
            <mat-card-content>
              <ul class="trend" data-cy="ccm-trend">
                @for (point of trend(); track point.date) {
                  <li data-cy="ccm-trend-point">
                    <span class="date">{{ point.date }}</span>
                    <span class="bar" [style.--ct-bar-ratio]="ratio(point.count)" aria-hidden="true"></span>
                    <span class="count">{{ point.count }}</span>
                  </li>
                }
              </ul>
            </mat-card-content>
          </mat-card>
        }

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Santé des contrôles</mat-card-title></mat-card-header>
          @if (o.controls?.length) {
            <table mat-table [dataSource]="o.controls ?? []" data-cy="ccm-overview-controls">
              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Contrôle</th>
                <td mat-cell *matCellDef="let ctl">
                  <a [routerLink]="['/ccm/controls', ctl.id]" data-cy="ccm-overview-control-link">{{ ctl.label }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>État</th>
                <td mat-cell *matCellDef="let ctl">{{ ctl.active ? 'Activé' : 'Désactivé' }}</td>
              </ng-container>
              <ng-container matColumnDef="health">
                <th mat-header-cell *matHeaderCellDef>Santé</th>
                <td mat-cell *matCellDef="let ctl">
                  <mat-chip-set>
                    <mat-chip disableRipple [attr.data-health]="ctl.health">{{ healthLabel(ctl.health) }}</mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="controlColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: controlColumns" data-cy="ccm-overview-control-row"></tr>
            </table>
          } @else {
            <mat-card-content><p data-cy="ccm-overview-empty">Aucun contrôle paramétré.</p></mat-card-content>
          }
        </mat-card>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .page-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ct-space-4); flex-wrap: wrap; }
      .head-actions { display: flex; gap: var(--ct-space-2); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--ct-space-3); margin-bottom: var(--ct-space-4); }
      .kpi { text-align: center; padding: var(--ct-space-4); }
      .kpi strong { display: block; font-size: 2rem; font-weight: 700; color: var(--ct-color-primary); line-height: 1.1; }
      .kpi span { color: var(--ct-color-muted); font-size: .82rem; }
      .kpi.alert strong { color: var(--ct-red-700); }
      .block { margin-bottom: var(--ct-space-4); }
      table[mat-table] { width: 100%; background: transparent; }
      .trend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-2); }
      .trend li { display: grid; grid-template-columns: 110px 1fr 40px; align-items: center; gap: var(--ct-space-3); }
      .trend .date { color: var(--ct-color-muted); font-size: .82rem; }
      .trend .bar { height: 10px; border-radius: var(--ct-radius-pill); background: var(--ct-color-primary); width: calc(var(--ct-bar-ratio, 0) * 100%); min-width: 4px; }
      .trend .count { text-align: right; font-variant-numeric: tabular-nums; }
      mat-chip[data-health='OK'] { --mdc-chip-elevated-container-color: var(--ct-green-50); color: var(--ct-green-600); }
      mat-chip[data-health='FAILING'] { --mdc-chip-elevated-container-color: var(--ct-red-50); color: var(--ct-red-700); }
      mat-chip[data-health='DRIFT'] { --mdc-chip-elevated-container-color: var(--ct-amber-50); color: var(--ct-amber-700); }
      mat-chip[data-health='NEVER_RUN'] { --mdc-chip-elevated-container-color: var(--ct-color-surface-alt); color: var(--ct-color-muted); }
    `,
  ],
})
export class CcmOverviewPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  readonly overview = signal<CcmOverview | null>(null);
  readonly trend = computed(() => this.overview()?.exceptionTrend ?? []);
  private readonly maxCount = computed(() => Math.max(1, ...this.trend().map((p) => p.count ?? 0)));
  readonly controlColumns = ['label', 'active', 'health'];

  ngOnInit(): void {
    this.facade.getOverview().subscribe((o) => this.overview.set(o));
  }

  ratio(count?: number): number {
    return (count ?? 0) / this.maxCount();
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }
}
