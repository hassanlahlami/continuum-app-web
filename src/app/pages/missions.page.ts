import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MissionPage } from '../../../libs/api-clients/missions';
import { MissionsFacade } from '../missions.facade';

/**
 * Liste des missions (archétype LISTE, §8) : recherche + pagination **côté serveur**, reflétées dans
 * l'URL (`?q=&page=`, partageable). Le serveur filtre selon le périmètre (feature `mission.read`).
 * Composants Material habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-missions',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <section>
      <h1>Missions</h1>
      <mat-card appearance="outlined">
        <mat-card-content>
          <form class="filters" (submit)="$event.preventDefault(); search(searchInput.value)">
            <mat-form-field appearance="outline" class="search">
              <mat-label>Rechercher</mat-label>
              <input matInput #searchInput type="search" name="q" [value]="query()" />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit">Rechercher</button>
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
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let m">{{ m.status.label }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Avancement</th>
                <td mat-cell *matCellDef="let m">{{ m.progressPercent ?? 0 }}%</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="mission-row"
                  class="clickable" (click)="open(row)"></tr>
            </table>
            <nav class="pager">
              <button mat-stroked-button type="button" (click)="go(p.page - 1)" [disabled]="p.page <= 0">Précédent</button>
              <span>Page {{ p.page + 1 }} / {{ p.totalPages }}</span>
              <button mat-stroked-button type="button" (click)="go(p.page + 1)" [disabled]="p.page + 1 >= p.totalPages">Suivant</button>
            </nav>
          </mat-card>
        } @else {
          <p>Aucune mission pour ces critères.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .filters { display: flex; gap: var(--ct-space-3); align-items: center; }
      .search { min-width: 280px; }
      .table-card { margin-top: var(--ct-space-4); padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      code { font-family: var(--ct-font-mono); }
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
  readonly query = signal<string>('');
  readonly columns = ['reference', 'title', 'status', 'progress'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const index = Math.max(0, Number(params.get('page') ?? 0) || 0);
      const q = params.get('q') ?? '';
      this.query.set(q);
      this.facade.list(index, 20, q || undefined).subscribe((p) => this.page.set(p));
    });
  }

  /** Ouvre la fiche mission (ligne entière cliquable). */
  open(m: { id: string }): void {
    this.router.navigate(['/missions', m.id]);
  }

  go(index: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: index },
      queryParamsHandling: 'merge',
    });
  }

  search(value: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null, page: 0 },
      queryParamsHandling: 'merge',
    });
  }
}
