import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MissionPage } from '../../../libs/api-clients/missions';
import { HasFeatureDirective } from '../directives/has-feature.directive';
import { MissionsFacade } from '../missions.facade';

/**
 * Liste des missions (archétype LISTE, §8) : recherche, plage de dates et « mes missions » — filtres
 * **côté serveur** reflétés dans l'URL (`?q=&from=&to=&mine=&page=`, partageable). Style « épuré &
 * dense ». Le serveur applique le périmètre (feature `mission.read`). Composants Material / tokens --ct-*.
 */
@Component({
  selector: 'ct-missions',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    HasFeatureDirective,
  ],
  template: `
    <section>
      <h1>Missions</h1>
      <a *hasFeature="'mission.create'" mat-flat-button color="primary" routerLink="/missions/new" data-cy="mission-new">Nouvelle mission</a>
      <mat-card appearance="outlined">
        <mat-card-content>
          <form class="filters" (submit)="$event.preventDefault(); apply(qF.value, fromF.value, toF.value, mineF.checked)">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="grow">
              <mat-label>Rechercher</mat-label>
              <input matInput #qF type="search" name="q" [value]="filters().q" placeholder="référence ou titre" data-cy="missions-search" />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Du</mat-label>
              <input matInput #fromF type="date" name="from" [value]="filters().from" data-cy="missions-from" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Au</mat-label>
              <input matInput #toF type="date" name="to" [value]="filters().to" data-cy="missions-to" />
            </mat-form-field>
            <mat-slide-toggle #mineF [checked]="filters().mine" data-cy="missions-mine">Mes missions</mat-slide-toggle>
            <div class="filter-actions">
              <button mat-flat-button color="primary" type="submit" data-cy="missions-apply">Filtrer</button>
              <button mat-stroked-button type="button" (click)="reset()" data-cy="missions-reset">Réinitialiser</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (page(); as p) {
        @if (p.items.length) {
          <mat-card appearance="outlined" class="table-card">
            <table mat-table [dataSource]="p.items" data-cy="missions-table">
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let m">
                  <a [routerLink]="['/missions', m.id]" data-cy="mission-link"><code>{{ m.reference }}</code></a>
                </td>
              </ng-container>
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Titre</th>
                <td mat-cell *matCellDef="let m">{{ m.title }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let m"><span class="muted">{{ m.missionType.label }}</span></td>
              </ng-container>
              <ng-container matColumnDef="lead">
                <th mat-header-cell *matHeaderCellDef>Responsable</th>
                <td mat-cell *matCellDef="let m">{{ m.lead?.displayName ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let m">
                  <mat-chip-set><mat-chip disableRipple [attr.data-status]="m.status.code">{{ m.status.label }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <ng-container matColumnDef="findings">
                <th mat-header-cell *matHeaderCellDef class="num">Constats</th>
                <td mat-cell *matCellDef="let m" class="num">{{ m.findingsCount ?? 0 }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Avancement</th>
                <td mat-cell *matCellDef="let m">
                  <div class="progress-cell">
                    <mat-progress-bar mode="determinate" [value]="m.progressPercent ?? 0" aria-label="Avancement"></mat-progress-bar>
                    <span class="pct">{{ m.progressPercent ?? 0 }}%</span>
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="mission-row"
                  class="clickable" (click)="open(row)"></tr>
            </table>
            <nav class="pager" aria-label="Pagination">
              <button mat-stroked-button type="button" (click)="go(p.page - 1)" [disabled]="p.page <= 0">Précédent</button>
              <span>Page {{ p.page + 1 }} / {{ p.totalPages }}</span>
              <button mat-stroked-button type="button" (click)="go(p.page + 1)" [disabled]="p.page + 1 >= p.totalPages">Suivant</button>
            </nav>
          </mat-card>
        } @else {
          <p data-cy="missions-empty">Aucune mission pour ces critères.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .filters { display: flex; flex-wrap: wrap; gap: var(--ct-space-3); align-items: center; }
      .filters .grow { flex: 1 1 240px; min-width: 200px; }
      .filters .dense { width: 170px; }
      .filter-actions { display: flex; gap: var(--ct-space-2); align-items: center; }
      .table-card { margin-top: var(--ct-space-4); padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      code { font-family: var(--ct-font-mono); }
      .muted { color: var(--ct-color-muted); }
      .num { text-align: right; }
      td.num { font-variant-numeric: tabular-nums; }
      .progress-cell { display: flex; align-items: center; gap: var(--ct-space-2); min-width: 130px; }
      .progress-cell mat-progress-bar { flex: 1; }
      .progress-cell .pct { color: var(--ct-color-muted); font-size: 0.82rem; font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; }
      .pager { display: flex; align-items: center; gap: var(--ct-space-3); padding: var(--ct-space-3) var(--ct-space-4); }
      .pager span { color: var(--ct-color-muted); }
    `,
  ],
})
export class MissionsPage implements OnInit {
  private readonly facade = inject(MissionsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<MissionPage | null>(null);
  readonly filters = signal<{ q: string; from: string; to: string; mine: boolean }>({ q: '', from: '', to: '', mine: false });
  readonly columns = ['reference', 'title', 'type', 'lead', 'status', 'findings', 'progress'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const index = Math.max(0, Number(params.get('page') ?? 0) || 0);
      const q = params.get('q') ?? '';
      const from = params.get('from') ?? '';
      const to = params.get('to') ?? '';
      const mine = params.get('mine') === 'true';
      this.filters.set({ q, from, to, mine });
      this.page.set(null);
      this.facade
        .list(index, 20, {
          q: q || undefined,
          from: from ? `${from}T00:00:00Z` : undefined,
          to: to ? `${to}T23:59:59Z` : undefined,
          mine: mine || undefined,
        })
        .subscribe((p) => this.page.set(p));
    });
  }

  /** Ouvre la fiche mission (ligne entière cliquable). */
  open(m: { id: string }): void {
    this.router.navigate(['/missions', m.id]);
  }

  go(index: number): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { page: index }, queryParamsHandling: 'merge' });
  }

  apply(q: string, from: string, to: string, mine: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q || null, from: from || null, to: to || null, mine: mine || null, page: 0 },
      queryParamsHandling: 'merge',
    });
  }

  reset(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
}
