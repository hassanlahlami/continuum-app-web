import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CcmOverview } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { HasFeatureDirective } from '../directives/has-feature.directive';
import { PermissionsStore } from '../permissions.store';

/**
 * Accueil — tableau de bord (§1.5/§8) : raccourcis par droit, instantané du contrôle continu (si
 * {@code ccm.read}) et fonctionnalités effectives (`/me/permissions`, §2.1.7). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-my-permissions',
  standalone: true,
  imports: [RouterLink, HasFeatureDirective, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <h1>Mes droits</h1>
      <nav class="quick-nav" data-cy="home-nav">
        <a mat-stroked-button routerLink="/missions" *hasFeature="'mission.read'">
          <mat-icon>folder_open</mat-icon> Missions
        </a>
        <a mat-stroked-button routerLink="/findings" *hasFeature="'finding.read'">
          <mat-icon>flag</mat-icon> Constats
        </a>
        <a mat-stroked-button routerLink="/ccm" *hasFeature="'finding.read'">
          <mat-icon>rule</mat-icon> Exceptions CCM
        </a>
      </nav>

      @if (overview(); as o) {
        <h2 class="section-title">Contrôle continu</h2>
        <div class="kpis" data-cy="home-ccm">
          <mat-card appearance="outlined" class="kpi" routerLink="/ccm" data-cy="home-kpi-to-triage">
            <mat-icon class="kpi-ic">rule</mat-icon>
            <strong>{{ o.exceptionsToTriage ?? 0 }}</strong><span>À trier</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" routerLink="/ccm">
            <mat-icon class="kpi-ic">pending_actions</mat-icon>
            <strong>{{ o.openExceptions ?? 0 }}</strong><span>Exceptions ouvertes</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" routerLink="/ccm/controls">
            <mat-icon class="kpi-ic">checklist</mat-icon>
            <strong>{{ o.activeControls ?? 0 }}</strong><span>Contrôles actifs</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" routerLink="/ccm/overview">
            <mat-icon class="kpi-ic">monitoring</mat-icon>
            <strong>{{ o.controls?.length ?? 0 }}</strong><span>Contrôles au catalogue</span>
          </mat-card>
        </div>
      }

      @if (store.permissions(); as p) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title>Fonctionnalités effectives</mat-card-title>
            <mat-card-subtitle>Version d'habilitation : {{ p.authzVersion }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul class="perms">
              @for (feature of p.features; track feature.code) {
                <li data-cy="permission-item">
                  <code>{{ feature.code }}</code>
                  <mat-chip-set>
                    @for (scope of feature.scopes; track scope.type + '/' + scope.id) {
                      <mat-chip disableRipple>{{ scope.type }}@if (scope.label) { — {{ scope.label }} }</mat-chip>
                    }
                  </mat-chip-set>
                </li>
              } @empty {
                <li>Aucun droit.</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .quick-nav { display: flex; flex-wrap: wrap; gap: var(--ct-space-2); margin-bottom: var(--ct-space-4); }
      .section-title { font-size: 1rem; color: var(--ct-color-muted); margin: var(--ct-space-4) 0 var(--ct-space-2); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--ct-space-3); margin-bottom: var(--ct-space-4); }
      .kpi { text-align: center; padding: var(--ct-space-4); text-decoration: none; cursor: pointer; transition: box-shadow .15s, border-color .15s, transform .15s; }
      .kpi:hover { box-shadow: var(--ct-shadow-md); border-color: var(--ct-color-primary); transform: translateY(-1px); }
      .kpi-ic { color: var(--ct-color-muted); margin-bottom: var(--ct-space-1); }
      .kpi strong { display: block; font-size: 2rem; font-weight: 700; color: var(--ct-color-primary); line-height: 1.1; }
      .kpi span { color: var(--ct-color-muted); font-size: .82rem; }
      .block { margin-top: var(--ct-space-2); }
      code { font-family: var(--ct-font-mono); }
      .perms { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-3); }
      .perms li { display: flex; align-items: center; gap: var(--ct-space-3); flex-wrap: wrap; }
    `,
  ],
})
export class MyPermissionsPage implements OnInit {
  protected readonly store = inject(PermissionsStore);
  private readonly ccm = inject(CcmFacade);
  readonly overview = signal<CcmOverview | null>(null);

  ngOnInit(): void {
    this.store.ensureLoaded().subscribe(() => {
      if (this.store.has('ccm.read')) {
        this.ccm.getOverview().subscribe((o) => this.overview.set(o));
      }
    });
  }
}
