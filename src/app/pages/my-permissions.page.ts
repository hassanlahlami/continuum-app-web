import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CcmOverview } from '../../../libs/api-clients/ccm';
import { Me } from '../../../libs/api-clients/me';
import { CcmFacade } from '../ccm.facade';
import { MeFacade } from '../me.facade';
import { HasFeatureDirective } from '../directives/has-feature.directive';
import { PermissionsStore } from '../permissions.store';

/**
 * Accueil — tableau de bord (§1.5/§8) : bandeau d'accueil (identité `/me`), raccourcis en cartes filtrés
 * par droit, instantané du contrôle continu (si {@code ccm.read}) et, en secondaire, les droits effectifs
 * (`/me/permissions`, §2.1.7). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-my-permissions',
  standalone: true,
  imports: [RouterLink, HasFeatureDirective, MatCardModule, MatChipsModule, MatIconModule],
  template: `
    <section>
      @if (me(); as m) {
        <header class="hero" data-cy="home-hero">
          <div class="avatar" aria-hidden="true">{{ initials(m.user.displayName) }}</div>
          <div class="hero-text">
            <h1 data-cy="home-greeting">Bonjour, {{ m.user.displayName }}</h1>
            <p class="hero-meta">
              @if (m.user.positionLabel) { <span>{{ m.user.positionLabel }}</span> }
              <span>{{ m.entity.label }}</span>
              @if (homeUnit(m); as unit) { <span>{{ unit }}</span> }
            </p>
          </div>
        </header>
      } @else {
        <header class="hero"><h1>Accueil</h1></header>
      }

      <nav class="shortcuts" data-cy="home-nav">
        <a class="shortcut" routerLink="/missions" *hasFeature="'mission.read'">
          <span class="sc-ic"><mat-icon>folder_open</mat-icon></span>
          <span class="sc-body">
            <strong>Missions</strong>
            <small>Conduire et suivre les missions d'audit</small>
          </span>
          <mat-icon class="sc-arrow">chevron_right</mat-icon>
        </a>
        <a class="shortcut" routerLink="/findings" *hasFeature="'finding.read'">
          <span class="sc-ic"><mat-icon>flag</mat-icon></span>
          <span class="sc-body">
            <strong>Constats</strong>
            <small>Vue transverse des constats et FRAP</small>
          </span>
          <mat-icon class="sc-arrow">chevron_right</mat-icon>
        </a>
        <a class="shortcut" routerLink="/ccm" *hasFeature="'finding.read'">
          <span class="sc-ic"><mat-icon>rule</mat-icon></span>
          <span class="sc-body">
            <strong>Exceptions CCM</strong>
            <small>Trier le flux du contrôle continu</small>
          </span>
          <mat-icon class="sc-arrow">chevron_right</mat-icon>
        </a>
      </nav>

      @if (overview(); as o) {
        <h2 class="section-title">Contrôle continu</h2>
        <div class="kpis" data-cy="home-ccm">
          <a class="kpi" routerLink="/ccm" data-cy="home-kpi-to-triage" [class.accent]="(o.exceptionsToTriage ?? 0) > 0">
            <mat-icon class="kpi-ic">rule</mat-icon>
            <strong>{{ o.exceptionsToTriage ?? 0 }}</strong><span>À trier</span>
          </a>
          <a class="kpi" routerLink="/ccm">
            <mat-icon class="kpi-ic">pending_actions</mat-icon>
            <strong>{{ o.openExceptions ?? 0 }}</strong><span>Exceptions ouvertes</span>
          </a>
          <a class="kpi" routerLink="/ccm/controls">
            <mat-icon class="kpi-ic">checklist</mat-icon>
            <strong>{{ o.activeControls ?? 0 }}</strong><span>Contrôles actifs</span>
          </a>
          <a class="kpi" routerLink="/ccm/overview">
            <mat-icon class="kpi-ic">monitoring</mat-icon>
            <strong>{{ o.controls?.length ?? 0 }}</strong><span>Contrôles au catalogue</span>
          </a>
        </div>
      }

      @if (store.permissions(); as p) {
        <h2 class="section-title">Mes droits effectifs</h2>
        <mat-card appearance="outlined" class="perms-card">
          <mat-card-content>
            <p class="perms-intro">
              Fonctionnalités dont vous disposez et leur périmètre d'application.
              <span class="muted">Version d'habilitation {{ p.authzVersion }}.</span>
            </p>
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
      section { background: transparent; border: 0; box-shadow: none; padding: 0; }

      .hero {
        display: flex;
        align-items: center;
        gap: var(--ct-space-4);
        padding: var(--ct-space-5) var(--ct-space-6);
        margin-bottom: var(--ct-space-5);
        border-radius: var(--ct-card-radius);
        border: 1px solid var(--ct-color-border);
        background: linear-gradient(135deg, color-mix(in srgb, var(--ct-color-primary) 14%, var(--ct-color-surface)), var(--ct-color-surface) 70%);
      }
      .avatar {
        flex: 0 0 auto;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--ct-color-primary);
        background: color-mix(in srgb, var(--ct-color-primary) 22%, var(--ct-color-surface));
      }
      .hero-text h1 { margin: 0; }
      .hero-meta { display: flex; flex-wrap: wrap; gap: var(--ct-space-1) var(--ct-space-2); margin: var(--ct-space-1) 0 0; color: var(--ct-color-muted); }
      .hero-meta span:not(:last-child)::after { content: '·'; margin-left: var(--ct-space-2); color: var(--ct-color-border); }

      .shortcuts { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--ct-space-3); margin-bottom: var(--ct-space-5); }
      .shortcut {
        display: flex;
        align-items: center;
        gap: var(--ct-space-3);
        padding: var(--ct-space-4);
        border-radius: var(--ct-card-radius);
        border: 1px solid var(--ct-color-border);
        background: var(--ct-color-surface);
        text-decoration: none;
        color: var(--ct-color-text);
        transition: box-shadow .15s, border-color .15s, transform .15s;
      }
      .shortcut:hover { box-shadow: var(--ct-shadow-md); border-color: var(--ct-color-primary); transform: translateY(-1px); text-decoration: none; }
      .sc-ic { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; color: var(--ct-color-primary); background: var(--ct-color-primary-soft); }
      .sc-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .sc-body strong { font-weight: 600; }
      .sc-body small { color: var(--ct-color-muted); }
      .sc-arrow { color: var(--ct-color-muted); flex: 0 0 auto; }

      .section-title { font-size: 0.9rem; font-weight: 600; color: var(--ct-color-muted); text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 var(--ct-space-3); }

      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--ct-space-3); margin-bottom: var(--ct-space-5); }
      .kpi { text-align: center; padding: var(--ct-space-4); border-radius: var(--ct-card-radius); border: 1px solid var(--ct-color-border); background: var(--ct-color-surface); text-decoration: none; cursor: pointer; transition: box-shadow .15s, border-color .15s, transform .15s; }
      .kpi:hover { box-shadow: var(--ct-shadow-md); border-color: var(--ct-color-primary); transform: translateY(-1px); }
      .kpi-ic { color: var(--ct-color-muted); margin-bottom: var(--ct-space-1); }
      .kpi strong { display: block; font-size: 2rem; font-weight: 700; color: var(--ct-color-primary); line-height: 1.1; }
      .kpi span { color: var(--ct-color-muted); font-size: .82rem; }
      .kpi.accent { border-color: color-mix(in srgb, var(--ct-color-primary) 40%, var(--ct-color-border)); background: color-mix(in srgb, var(--ct-color-primary) 6%, var(--ct-color-surface)); }

      .perms-card { background: var(--ct-color-surface); }
      .perms-intro { margin: 0 0 var(--ct-space-3); }
      .perms-intro .muted { color: var(--ct-color-muted); }
      .muted { color: var(--ct-color-muted); }
      code { font-family: var(--ct-font-mono); }
      .perms { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-2); }
      .perms li { display: flex; align-items: center; gap: var(--ct-space-3); flex-wrap: wrap; padding: var(--ct-space-1) 0; }
      .perms li:not(:last-child) { border-bottom: 1px solid var(--ct-color-border); }
      .perms code { min-width: 170px; color: var(--ct-color-text); }
    `,
  ],
})
export class MyPermissionsPage implements OnInit {
  protected readonly store = inject(PermissionsStore);
  private readonly ccm = inject(CcmFacade);
  private readonly meFacade = inject(MeFacade);
  readonly overview = signal<CcmOverview | null>(null);
  readonly me = signal<Me | null>(null);

  ngOnInit(): void {
    this.meFacade.currentUser().subscribe((m) => this.me.set(m));
    this.store.ensureLoaded().subscribe(() => {
      if (this.store.has('ccm.read')) {
        this.ccm.getOverview().subscribe((o) => this.overview.set(o));
      }
    });
  }

  /** Unité de rattachement principale (première affectation « titulaire »), pour le bandeau d'accueil. */
  homeUnit(m: Me): string | null {
    return m.assignments?.find((a) => a.kind === 'HOLDER')?.unit?.label ?? m.assignments?.[0]?.unit?.label ?? null;
  }

  /** Initiales (max 2) pour l'avatar du bandeau d'accueil. */
  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }
}
