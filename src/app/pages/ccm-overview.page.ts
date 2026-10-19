import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [DatePipe, RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule],
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
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-exceptions-to-triage" routerLink="/ccm">
            <mat-icon class="kpi-ic">rule</mat-icon>
            <strong>{{ o.exceptionsToTriage ?? 0 }}</strong><span>À trier</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-open-exceptions" routerLink="/ccm">
            <mat-icon class="kpi-ic">pending_actions</mat-icon>
            <strong>{{ o.openExceptions ?? 0 }}</strong><span>Exceptions ouvertes</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-active-controls" routerLink="/ccm/controls">
            <mat-icon class="kpi-ic">checklist</mat-icon>
            <strong>{{ o.activeControls ?? 0 }}</strong><span>Contrôles actifs</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-failing-controls" routerLink="/ccm/controls"
             [class.alert]="(o.failingControls ?? 0) > 0">
            <mat-icon class="kpi-ic">error</mat-icon>
            <strong>{{ o.failingControls ?? 0 }}</strong><span>En échec</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" data-cy="kpi-drifting-controls" routerLink="/ccm/controls"
             [class.warn]="(o.driftingControls ?? 0) > 0">
            <mat-icon class="kpi-ic">trending_up</mat-icon>
            <strong>{{ o.driftingControls ?? 0 }}</strong><span>En dérive</span>
          </mat-card>
        </div>

        @if (trend().length) {
          <mat-card appearance="outlined" class="block">
            <mat-card-header><mat-card-title>Tendance des détections</mat-card-title></mat-card-header>
            <mat-card-content>
              <svg class="trend-chart" data-cy="ccm-trend" role="img"
                   aria-label="Tendance des détections d'exceptions par jour"
                   [attr.viewBox]="'0 0 ' + chart().width + ' ' + chart().height" preserveAspectRatio="xMidYMid meet">
                <line class="axis" [attr.x1]="6" [attr.y1]="chart().baselineY"
                      [attr.x2]="chart().width - 6" [attr.y2]="chart().baselineY" />
                @for (b of chart().bars; track b.date) {
                  <g data-cy="ccm-trend-point">
                    <title>{{ b.date | date: 'longDate' }} : {{ b.count }}</title>
                    <rect class="bar" [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="4" />
                    <text class="val" [attr.x]="b.cx" [attr.y]="b.y - 6" text-anchor="middle">{{ b.count }}</text>
                    <text class="lbl" [attr.x]="b.cx" [attr.y]="chart().baselineY + 18" text-anchor="middle">
                      {{ b.date | date: 'dd/MM' }}
                    </text>
                  </g>
                }
              </svg>
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
      .kpi { text-align: center; padding: var(--ct-space-4); text-decoration: none; cursor: pointer; transition: box-shadow .15s, border-color .15s, transform .15s; }
      .kpi:hover { box-shadow: var(--ct-shadow-md); border-color: var(--ct-color-primary); transform: translateY(-1px); }
      .kpi-ic { color: var(--ct-color-muted); margin-bottom: var(--ct-space-1); }
      .kpi strong { display: block; font-size: 2rem; font-weight: 700; color: var(--ct-color-primary); line-height: 1.1; }
      .kpi span { color: var(--ct-color-muted); font-size: .82rem; }
      .kpi.alert strong, .kpi.alert .kpi-ic { color: var(--ct-red-700); }
      .kpi.warn strong, .kpi.warn .kpi-ic { color: var(--ct-amber-700); }
      .block { margin-bottom: var(--ct-space-4); }
      table[mat-table] { width: 100%; background: transparent; }
      .trend-chart { width: 100%; max-width: 560px; height: auto; display: block; }
      .trend-chart .bar { fill: var(--ct-color-primary); transition: fill .15s; }
      .trend-chart g:hover .bar { fill: var(--ct-color-primary-hover); }
      .trend-chart .axis { stroke: var(--ct-color-border); stroke-width: 1; }
      .trend-chart .val { fill: var(--ct-color-text); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
      .trend-chart .lbl { fill: var(--ct-color-muted); font-size: 11px; }
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
  readonly controlColumns = ['label', 'active', 'health'];

  /** Géométrie du diagramme à colonnes (série unique, tendance quotidienne). Mono-teinte --ct-color-primary. */
  readonly chart = computed(() => {
    const pts = this.trend();
    const slot = 86;
    const barW = 44;
    const top = 16;
    const bottom = 28;
    const plotH = 120;
    const baselineY = top + plotH;
    const max = Math.max(1, ...pts.map((p) => p.count ?? 0));
    const bars = pts.map((p, i) => {
      const count = p.count ?? 0;
      const h = (count / max) * plotH;
      const x = 6 + i * slot + (slot - barW) / 2;
      return { date: p.date, count, x, w: barW, y: baselineY - h, h, cx: x + barW / 2 };
    });
    return { width: 6 + pts.length * slot + 6, height: baselineY + bottom, baselineY, bars };
  });

  ngOnInit(): void {
    this.facade.getOverview().subscribe((o) => this.overview.set(o));
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }
}
