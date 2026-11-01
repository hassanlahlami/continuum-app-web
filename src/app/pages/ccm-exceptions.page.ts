import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { CcmExceptionPage } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';

/**
 * Flux d'exceptions du contrôle continu (CCM, §5.3, D34) : le moteur produit des <strong>exceptions</strong>
 * à trier (jamais des constats). Le serveur applique le périmètre ({@code ccm.read}) et renvoie les
 * exceptions ; le front affiche et renvoie vers le détail pour le triage (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-ccm-exceptions',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatSlideToggleModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule],
  template: `
    <section>
      <header class="page-head">
        <h1>Exceptions CCM</h1>
        <span class="head-actions">
          <a mat-stroked-button routerLink="/ccm/overview" data-cy="ccm-overview-link">Vue d'ensemble</a>
          <a mat-stroked-button routerLink="/ccm/controls" data-cy="ccm-controls-link">Bibliothèque</a>
        </span>
      </header>
      <p class="page-sub">Exceptions détectées par le contrôle continu, à trier par un auditeur habilité.</p>

      <mat-slide-toggle class="filter-mine" [checked]="mine()" (change)="applyMine($event.checked)" data-cy="ccm-mine">
        Qui me sont affectées
      </mat-slide-toggle>

      <span class="filters">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Statut</mat-label>
          <mat-select [value]="status()" (selectionChange)="applyFilter('status', $event.value)" data-cy="ccm-filter-status">
            <mat-option [value]="''">Tous</mat-option>
            <mat-option value="NEW">À trier</mat-option>
            <mat-option value="RETAINED">Retenue</mat-option>
            <mat-option value="DISMISSED">Écartée</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Criticité</mat-label>
          <mat-select [value]="criticality()" (selectionChange)="applyFilter('criticality', $event.value)" data-cy="ccm-filter-criticality">
            <mat-option [value]="''">Toutes</mat-option>
            <mat-option value="HIGH">Élevée</mat-option>
            <mat-option value="MEDIUM">Moyenne</mat-option>
            <mat-option value="LOW">Faible</mat-option>
          </mat-select>
        </mat-form-field>
      </span>

      @if (page(); as p) {
        @if (p.items.length) {
          <mat-card appearance="outlined" class="table-card">
            <table mat-table [dataSource]="p.items" data-cy="ccm-exceptions-table">
              <ng-container matColumnDef="control">
                <th mat-header-cell *matHeaderCellDef>Contrôle</th>
                <td mat-cell *matCellDef="let exc"><code>{{ exc.controlCode }}</code></td>
              </ng-container>
              <ng-container matColumnDef="summary">
                <th mat-header-cell *matHeaderCellDef>Résumé</th>
                <td mat-cell *matCellDef="let exc">
                  <a [routerLink]="['/ccm/exceptions', exc.id]" data-cy="ccm-exc-link">{{ exc.summary || '—' }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef>Unité</th>
                <td mat-cell *matCellDef="let exc">{{ exc.unit?.label ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Montant</th>
                <td mat-cell *matCellDef="let exc" class="num">{{ exc.amount ? exc.amount.amount + ' ' + exc.amount.currency : '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="detectedAt">
                <th mat-header-cell *matHeaderCellDef>Détectée le</th>
                <td mat-cell *matCellDef="let exc">{{ exc.detectedAt | date: 'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="assignee">
                <th mat-header-cell *matHeaderCellDef>Affectée à</th>
                <td mat-cell *matCellDef="let exc">{{ exc.assignee?.displayName ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="criticality">
                <th mat-header-cell *matHeaderCellDef>Criticité</th>
                <td mat-cell *matCellDef="let exc">
                  @if (exc.criticality; as c) {
                    <mat-chip-set><mat-chip disableRipple [attr.data-criticality]="c.code">{{ c.label }}</mat-chip></mat-chip-set>
                  } @else { — }
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let exc">
                  <mat-chip-set><mat-chip disableRipple data-cy="ccm-exc-status" [attr.data-status]="exc.status.code">{{ exc.status.label }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="ccm-row"
                  class="clickable" (click)="open(row)"></tr>
            </table>
          </mat-card>
        } @else {
          <p data-cy="ccm-empty">Aucune exception à trier.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .page-head { display: flex; align-items: center; justify-content: space-between; gap: var(--ct-space-4); flex-wrap: wrap; }
      .head-actions { display: flex; gap: var(--ct-space-2); }
      .page-sub { color: var(--ct-color-muted); margin-top: 0; }
      .filter-mine { display: inline-block; margin-bottom: var(--ct-space-3); }
      .table-card { padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      .filters { display: inline-flex; gap: var(--ct-space-3); margin-inline-start: var(--ct-space-4); }
      td.num { font-variant-numeric: tabular-nums; text-align: end; }
      code { font-family: var(--ct-font-mono); }
    `,
  ],
})
export class CcmExceptionsPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<CcmExceptionPage | null>(null);
  readonly mine = signal(false);
  readonly status = signal('');
  readonly criticality = signal('');
  readonly columns = ['control', 'summary', 'unit', 'amount', 'detectedAt', 'criticality', 'status', 'assignee'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const assignedToMe = params.get('assignedToMe') === 'true';
      this.mine.set(assignedToMe);
      this.status.set(params.get('status') ?? '');
      this.criticality.set(params.get('criticality') ?? '');
      this.page.set(null);
      this.facade
        .listExceptions({
          assignedToMe: assignedToMe || undefined,
          status: this.status() ? [this.status()] : undefined,
          criticality: this.criticality() || undefined,
        })
        .subscribe((p) => this.page.set(p));
    });
  }

  /** Bascule le filtre « qui me sont affectées » (reflété dans l'URL). */
  applyMine(checked: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { assignedToMe: checked || null },
      queryParamsHandling: 'merge',
    });
  }

  /** Applique un filtre serveur (statut, criticité) reflété dans l'URL. */
  applyFilter(key: 'status' | 'criticality', value: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { [key]: value || null }, queryParamsHandling: 'merge' });
  }

  /** Ouvre le détail de l'exception (ligne entière cliquable). */
  open(exc: { id: string }): void {
    this.router.navigate(['/ccm/exceptions', exc.id]);
  }
}
