import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CcmControl, CcmOverview } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Vue d'ensemble du contrôle continu (cockpit CCM, §5) : indicateurs (contrôles actifs / en échec / en
 * dérive, exceptions ouvertes / à trier), tendance des détections, et l'état de santé par contrôle. Le
 * serveur agrège dans le périmètre {@code ccm.read} (D32) ; lecture seule. Point d'entrée vers le flux
 * d'exceptions et la bibliothèque de contrôles.
 */
@Component({
  selector: 'ct-ccm-overview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <h1>Contrôle continu</h1>
      <p>
        Vue d'ensemble du cockpit (§5).
        <a routerLink="/ccm" data-cy="ccm-exceptions-link">Flux d'exceptions →</a>
        <a routerLink="/ccm/controls" data-cy="ccm-controls-link">Bibliothèque de contrôles →</a>
      </p>

      @if (overview(); as o) {
        <ul class="kpis" data-cy="ccm-kpis">
          <li data-cy="kpi-exceptions-to-triage">
            <strong>{{ o.exceptionsToTriage ?? 0 }}</strong><span>À trier</span>
          </li>
          <li data-cy="kpi-open-exceptions">
            <strong>{{ o.openExceptions ?? 0 }}</strong><span>Exceptions ouvertes</span>
          </li>
          <li data-cy="kpi-active-controls">
            <strong>{{ o.activeControls ?? 0 }}</strong><span>Contrôles actifs</span>
          </li>
          <li data-cy="kpi-failing-controls" [class.alert]="(o.failingControls ?? 0) > 0">
            <strong>{{ o.failingControls ?? 0 }}</strong><span>En échec</span>
          </li>
          <li data-cy="kpi-drifting-controls" [class.alert]="(o.driftingControls ?? 0) > 0">
            <strong>{{ o.driftingControls ?? 0 }}</strong><span>En dérive</span>
          </li>
        </ul>

        @if (trend().length) {
          <h2>Tendance des détections</h2>
          <ul class="trend" data-cy="ccm-trend">
            @for (point of trend(); track point.date) {
              <li data-cy="ccm-trend-point">
                <span class="date">{{ point.date }}</span>
                <span class="bar" [style.--ct-bar-ratio]="ratio(point.count)" aria-hidden="true"></span>
                <span class="count">{{ point.count }}</span>
              </li>
            }
          </ul>
        }

        <h2>Santé des contrôles</h2>
        @if (o.controls?.length) {
          <table data-cy="ccm-overview-controls">
            <thead><tr><th>Contrôle</th><th>État</th><th>Santé</th></tr></thead>
            <tbody>
              @for (ctl of o.controls; track ctl.id) {
                <tr data-cy="ccm-overview-control-row">
                  <td><a [routerLink]="['/ccm/controls', ctl.id]" data-cy="ccm-overview-control-link">{{ ctl.label }}</a></td>
                  <td>{{ ctl.active ? 'Activé' : 'Désactivé' }}</td>
                  <td><span class="badge" [attr.data-health]="ctl.health">{{ healthLabel(ctl.health) }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p data-cy="ccm-overview-empty">Aucun contrôle paramétré.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmOverviewPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  readonly overview = signal<CcmOverview | null>(null);
  readonly trend = computed(() => this.overview()?.exceptionTrend ?? []);
  private readonly maxCount = computed(() =>
    Math.max(1, ...this.trend().map((p) => p.count ?? 0)),
  );

  ngOnInit(): void {
    this.facade.getOverview().subscribe((o) => this.overview.set(o));
  }

  /** Ratio 0..1 d'un point de tendance pour la barre (token `--ct-bar-ratio`), sans valeur visuelle en dur. */
  ratio(count?: number): number {
    return (count ?? 0) / this.maxCount();
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }
}
