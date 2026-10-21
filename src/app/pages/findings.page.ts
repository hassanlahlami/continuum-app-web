import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Finding, FindingPage } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Vue transverse des constats (archétype LISTE, §8) : tous les constats du périmètre
 * (`GET /findings`, feature `finding.read`), avec **filtres multicritères côté serveur** reflétés dans
 * l'URL (`?q=&source=&from=&to=`, partageable). Style « épuré & dense ». Composants Material / tokens --ct-*.
 */
@Component({
  selector: 'ct-findings',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <section>
      <h1>Constats</h1>

      <mat-card appearance="outlined">
        <mat-card-content>
          <form class="filters" (submit)="$event.preventDefault(); apply(qF.value, srcF.value, fromF.value, toF.value)">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="grow">
              <mat-label>Rechercher</mat-label>
              <input matInput #qF type="search" name="q" [value]="filters().q" placeholder="référence ou titre" data-cy="findings-q" />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Source</mat-label>
              <mat-select #srcF name="source" [value]="filters().source" data-cy="findings-source">
                <mat-option value="">Toutes</mat-option>
                <mat-option value="MANUAL">Manuel</mat-option>
                <mat-option value="CCM">Contrôle continu</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Du</mat-label>
              <input matInput #fromF type="date" name="from" [value]="filters().from" data-cy="findings-from" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Au</mat-label>
              <input matInput #toF type="date" name="to" [value]="filters().to" data-cy="findings-to" />
            </mat-form-field>
            <div class="filter-actions">
              <button mat-flat-button color="primary" type="submit" data-cy="findings-apply">Filtrer</button>
              <button mat-stroked-button type="button" (click)="reset()" data-cy="findings-reset">Réinitialiser</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (page(); as p) {
        @if (p.items.length) {
          <mat-card appearance="outlined" class="table-card">
            <table mat-table [dataSource]="p.items" data-cy="findings-table">
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let f"><code>{{ f.reference }}</code></td>
              </ng-container>
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Titre</th>
                <td mat-cell *matCellDef="let f">{{ f.title }}</td>
              </ng-container>
              <ng-container matColumnDef="criticality">
                <th mat-header-cell *matHeaderCellDef>Criticité</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip-set><mat-chip disableRipple [attr.data-criticality]="f.criticality?.code">{{ f.criticality?.label ?? '—' }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip-set><mat-chip disableRipple [attr.data-status]="f.status.code">{{ f.status.label }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef>Source</th>
                <td mat-cell *matCellDef="let f"><span class="muted">{{ f.source === 'CCM' ? 'Contrôle continu' : 'Manuel' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="mission">
                <th mat-header-cell *matHeaderCellDef>Mission</th>
                <td mat-cell *matCellDef="let f">{{ f.missionTitle ?? '—' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="finding-row"
                  class="clickable" (click)="open(row)"></tr>
            </table>
          </mat-card>
        } @else {
          <p data-cy="findings-empty">Aucun constat pour ces critères.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .filters { display: flex; flex-wrap: wrap; gap: var(--ct-space-3); align-items: flex-start; }
      .filters .grow { flex: 1 1 240px; min-width: 200px; }
      .filters .dense { width: 170px; }
      .filter-actions { display: flex; gap: var(--ct-space-2); align-items: center; height: 56px; }
      .table-card { margin-top: var(--ct-space-4); padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      code { font-family: var(--ct-font-mono); }
      .muted { color: var(--ct-color-muted); }
    `,
  ],
})
export class FindingsPage implements OnInit {
  private readonly facade = inject(FindingsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<FindingPage | null>(null);
  readonly filters = signal<{ q: string; source: string; from: string; to: string }>({ q: '', source: '', from: '', to: '' });
  readonly columns = ['reference', 'title', 'criticality', 'status', 'source', 'mission'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') ?? '';
      const source = params.get('source') ?? '';
      const from = params.get('from') ?? '';
      const to = params.get('to') ?? '';
      this.filters.set({ q, source, from, to });
      this.page.set(null);
      this.facade
        .search({
          q: q || undefined,
          source: (source as 'MANUAL' | 'CCM') || undefined,
          from: from ? `${from}T00:00:00Z` : undefined,
          to: to ? `${to}T23:59:59Z` : undefined,
        })
        .subscribe((p) => this.page.set(p));
    });
  }

  apply(q: string, source: string, from: string, to: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q || null, source: source || null, from: from || null, to: to || null },
      queryParamsHandling: 'merge',
    });
  }

  reset(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Ouvre la FRAP du constat si sa mission est connue (ligne cliquable). */
  open(f: Finding): void {
    if (f.missionId) {
      this.router.navigate(['/missions', f.missionId, 'findings', f.id]);
    }
  }
}
