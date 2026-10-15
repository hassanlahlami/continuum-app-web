import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CcmControl } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_CATEGORY_LABELS, CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Bibliothèque de contrôles du contrôle continu (CCM, §5) : liste filtrable (recherche libre, catégorie,
 * activation). Le serveur applique le périmètre ({@code ccm.read}) et renvoie l'état de santé ; le front
 * affiche et renvoie vers la fiche (D32). Lecture seule. Composants Material habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-ccm-controls',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <header class="page-head">
        <h1>Bibliothèque de contrôles</h1>
        <a mat-stroked-button routerLink="/ccm" data-cy="ccm-exceptions-link">Flux d'exceptions</a>
      </header>
      <p class="page-sub">Contrôles du contrôle continu, activés ou non pour l'entité.</p>

      <mat-card appearance="outlined">
        <mat-card-content>
          <form class="filters" (submit)="$event.preventDefault(); reload()">
            <mat-form-field appearance="outline">
              <mat-label>Recherche</mat-label>
              <input matInput data-cy="ccm-controls-search" [value]="q()" (input)="q.set($any($event.target).value)" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Catégorie</mat-label>
              <mat-select data-cy="ccm-controls-category" [value]="category() ?? ''"
                          (selectionChange)="onCategory($event.value)">
                <mat-option value="">Toutes</mat-option>
                @for (c of categories; track c) {
                  <mat-option [value]="c">{{ categoryLabel(c) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>État</mat-label>
              <mat-select data-cy="ccm-controls-active" [value]="activeFilter()"
                          (selectionChange)="onActive($event.value)">
                <mat-option value="">Tous</mat-option>
                <mat-option value="true">Activés</mat-option>
                <mat-option value="false">Désactivés</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" data-cy="ccm-controls-apply">Filtrer</button>
          </form>
        </mat-card-content>
      </mat-card>

      @if (controls(); as list) {
        @if (list.length) {
          <mat-card appearance="outlined" class="table-card">
            <table mat-table [dataSource]="list" data-cy="ccm-controls-table">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let ctl"><code>{{ ctl.code }}</code></td>
              </ng-container>
              <ng-container matColumnDef="label">
                <th mat-header-cell *matHeaderCellDef>Contrôle</th>
                <td mat-cell *matCellDef="let ctl">
                  <a [routerLink]="['/ccm/controls', ctl.id]" data-cy="ccm-control-link">{{ ctl.label }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Catégorie</th>
                <td mat-cell *matCellDef="let ctl">{{ categoryLabel(ctl.category) }}</td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>État</th>
                <td mat-cell *matCellDef="let ctl" data-cy="ccm-control-active">
                  {{ ctl.active ? 'Activé' : 'Désactivé' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="health">
                <th mat-header-cell *matHeaderCellDef>Santé</th>
                <td mat-cell *matCellDef="let ctl">
                  <mat-chip-set>
                    <mat-chip [attr.data-cy]="'ccm-control-health'" [attr.data-health]="ctl.health" disableRipple>
                      {{ healthLabel(ctl.health) }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="ccm-control-row"
                  class="clickable" (click)="open(row)"></tr>
            </table>
          </mat-card>
        } @else {
          <p data-cy="ccm-controls-empty">Aucun contrôle ne correspond aux filtres.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .page-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ct-space-4); }
      .page-sub { color: var(--ct-color-muted); margin-top: 0; }
      .filters { display: flex; flex-wrap: wrap; gap: var(--ct-space-3); align-items: center; }
      .filters mat-form-field { min-width: 180px; }
      .table-card { margin-top: var(--ct-space-4); padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      code { font-family: var(--ct-font-mono); }
      mat-chip[data-health='OK'] { --mdc-chip-elevated-container-color: var(--ct-green-50); color: var(--ct-green-600); }
      mat-chip[data-health='FAILING'] { --mdc-chip-elevated-container-color: var(--ct-red-50); color: var(--ct-red-700); }
      mat-chip[data-health='DRIFT'] { --mdc-chip-elevated-container-color: var(--ct-amber-50); color: var(--ct-amber-700); }
      mat-chip[data-health='NEVER_RUN'] { --mdc-chip-elevated-container-color: var(--ct-color-surface-alt); color: var(--ct-color-muted); }
    `,
  ],
})
export class CcmControlsPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  private readonly router = inject(Router);
  readonly controls = signal<CcmControl[] | null>(null);
  readonly q = signal('');
  readonly category = signal<CcmControl.CategoryEnum | null>(null);
  readonly activeFilter = signal<'' | 'true' | 'false'>('');
  readonly categories = Object.values(CcmControl.CategoryEnum);
  readonly columns = ['code', 'label', 'category', 'active', 'health'];

  ngOnInit(): void {
    this.reload();
  }

  /** Ouvre la fiche du contrôle (ligne entière cliquable). */
  open(ctl: CcmControl): void {
    this.router.navigate(['/ccm/controls', ctl.id]);
  }

  onCategory(value: string): void {
    this.category.set(value ? (value as CcmControl.CategoryEnum) : null);
    this.reload();
  }

  onActive(value: string): void {
    this.activeFilter.set(value === 'true' || value === 'false' ? value : '');
    this.reload();
  }

  reload(): void {
    const active = this.activeFilter() === '' ? undefined : this.activeFilter() === 'true';
    this.facade
      .listControls(this.q().trim() || undefined, this.category() ?? undefined, active)
      .subscribe((list) => this.controls.set(list));
  }

  categoryLabel(c: CcmControl.CategoryEnum): string {
    return CCM_CATEGORY_LABELS[c] ?? c;
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }
}
