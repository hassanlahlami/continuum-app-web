import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Me } from '../../libs/api-clients/me';
import { ApiErrorStore } from './errors/api-error.store';
import { MeFacade } from './me.facade';
import { PermissionsStore } from './permissions.store';

/** Un lien de navigation ; {@code feature} le masque si l'utilisateur ne détient pas ce droit (§2.1.7). */
interface NavItem {
  label: string;
  icon: string;
  route: string;
  feature?: string;
  exact?: boolean;
}

/** Un groupe de liens (section de la barre latérale). */
interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Coquille applicative (§1.2) — layout « cockpit » : barre latérale repliable (navigation groupée,
 * filtrée par les droits effectifs, §2.1.7), barre supérieure (utilisateur/entité) et zone de contenu
 * routée. Material habillé par les tokens --ct-* (pont M3, theme.scss). Responsive : la barre latérale
 * passe en mode « over » (tiroir) sous la largeur tablette.
 */
@Component({
  selector: 'ct-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #drawer
        class="shell-nav"
        data-cy="app-sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
      >
        <div class="brand">
          <mat-icon aria-hidden="true">shield</mat-icon>
          <span>Continuum</span>
        </div>
        <mat-nav-list>
          @for (group of visibleGroups(); track $index) {
            @if (group.label) {
              <h3 matSubheader>{{ group.label }}</h3>
            }
            @for (item of group.items; track item.route) {
              <a
                mat-list-item
                [routerLink]="item.route"
                routerLinkActive="active-nav"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                [attr.data-cy]="'nav-' + item.route"
                (click)="isHandset() && drawer.close()"
              >
                <mat-icon matListItemIcon aria-hidden="true">{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <mat-toolbar class="app-bar">
          @if (isHandset()) {
            <button mat-icon-button aria-label="Menu" (click)="drawer.toggle()" data-cy="nav-toggle">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <nav class="breadcrumb" aria-label="Fil d'Ariane" data-cy="breadcrumb">
            @for (c of crumbs(); track $index; let last = $last, first = $first) {
              @if (!first) { <mat-icon class="crumb-sep" aria-hidden="true">chevron_right</mat-icon> }
              <span [class.current]="last">{{ c }}</span>
            }
          </nav>
          <span class="spacer"></span>
          @if (me(); as user) {
            <div class="user" data-cy="app-user">
              <strong>{{ user.user.displayName }}</strong>
              <span>{{ user.entity.label }}</span>
            </div>
          }
        </mat-toolbar>

        @if (errors.error(); as e) {
          <div class="api-error" role="alert">
            {{ e.message }}
            @if (e.traceId) { <small>(réf. {{ e.traceId }})</small> }
            <button type="button" (click)="errors.clear()" aria-label="Fermer">×</button>
          </div>
        }

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell { position: absolute; inset: 0; background: var(--ct-color-bg); }
      .shell-nav {
        width: 264px;
        border-right: 1px solid var(--ct-color-border);
        background: var(--ct-color-surface);
      }
      .brand {
        display: flex; align-items: center; gap: var(--ct-space-2);
        height: var(--ct-appbar-height); padding: 0 var(--ct-space-4);
        font-family: var(--ct-font-heading); font-weight: 700; font-size: 1.05rem;
        color: var(--ct-color-primary);
        border-bottom: 1px solid var(--ct-color-border);
      }
      .brand mat-icon { color: var(--ct-color-primary); }
      h3[matSubheader] {
        color: var(--ct-color-muted); font-size: .72rem; letter-spacing: .06em;
        text-transform: uppercase; margin-top: var(--ct-space-3);
      }
      a.active-nav { --mat-list-list-item-label-text-color: var(--ct-color-primary); }
      a.active-nav mat-icon { color: var(--ct-color-primary); }
      .app-bar {
        position: sticky; top: 0; z-index: 2;
        background: var(--ct-color-surface); color: var(--ct-color-text);
        border-bottom: 1px solid var(--ct-color-border);
        box-shadow: var(--ct-shadow-sm);
      }
      .app-bar-title { font-family: var(--ct-font-heading); font-weight: 600; font-size: 1rem; }
      .breadcrumb { display: flex; align-items: center; gap: var(--ct-space-1); font-size: .9rem; color: var(--ct-color-muted); }
      .breadcrumb .current { color: var(--ct-color-text); font-weight: 600; }
      .breadcrumb .crumb-sep { font-size: 18px; width: 18px; height: 18px; color: var(--ct-color-muted); }
      .spacer { flex: 1 1 auto; }
      .user { display: flex; flex-direction: column; line-height: 1.15; text-align: right; }
      .user strong { font-size: .9rem; }
      .user span { font-size: .78rem; color: var(--ct-color-muted); }
      .content { padding: var(--ct-space-5); max-width: 1180px; margin: 0 auto; }
      .api-error {
        display: flex; align-items: center; gap: var(--ct-space-2);
        margin: var(--ct-space-3) var(--ct-space-5) 0;
        padding: var(--ct-space-3) var(--ct-space-4);
        background: var(--ct-red-50); color: var(--ct-red-700);
        border: 1px solid var(--ct-red-100); border-radius: var(--ct-radius-md);
      }
      .api-error button { margin-left: auto; background: none; border: 0; font-size: 1.1rem; cursor: pointer; color: inherit; }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly facade = inject(MeFacade);
  private readonly permissions = inject(PermissionsStore);
  protected readonly errors = inject(ApiErrorStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly me = signal<Me | null>(null);
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  /** Fil d'Ariane de la route courante (depuis `data.crumb`), recalculé à chaque navigation. */
  readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.buildCrumbs()),
    ),
    { initialValue: ['Accueil'] },
  );

  private readonly groups: NavGroup[] = [
    { items: [{ label: 'Accueil', icon: 'home', route: '/', exact: true }] },
    {
      items: [
        { label: 'Missions', icon: 'folder_open', route: '/missions', feature: 'mission.read' },
        { label: 'Constats', icon: 'flag', route: '/findings', feature: 'finding.read' },
      ],
    },
    {
      label: 'Contrôle continu',
      items: [
        { label: "Vue d'ensemble", icon: 'monitoring', route: '/ccm/overview', feature: 'ccm.read' },
        { label: 'Exceptions', icon: 'rule', route: '/ccm', feature: 'ccm.read', exact: true },
        { label: 'Bibliothèque', icon: 'checklist', route: '/ccm/controls', feature: 'ccm.read' },
      ],
    },
  ];

  /** Groupes dont au moins un lien est visible pour l'utilisateur courant. */
  readonly visibleGroups = computed(() => {
    this.permissions.permissions(); // dépendance réactive : recalcule au chargement des droits
    return this.groups
      .map((g) => ({ label: g.label, items: g.items.filter((i) => !i.feature || this.permissions.has(i.feature)) }))
      .filter((g) => g.items.length > 0);
  });

  constructor() {
    // mat-icon rend les icônes « Material Symbols Outlined » (police auto-hébergée, D26).
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }

  ngOnInit(): void {
    this.facade.currentUser().subscribe((user) => this.me.set(user));
    this.permissions.ensureLoaded().subscribe();
  }

  /** Remonte l'arbre de routes actif et renvoie le `crumb` le plus profond (sinon « Accueil »). */
  private buildCrumbs(): string[] {
    let snapshot = this.route.snapshot.firstChild;
    let crumb: string[] | undefined;
    while (snapshot) {
      const data = snapshot.data['crumb'] as string[] | undefined;
      if (data) {
        crumb = data;
      }
      snapshot = snapshot.firstChild;
    }
    return crumb ?? ['Accueil'];
  }
}
