import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
  imports: [RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatProgressBarModule],
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
      .table-card { padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      tr.clickable { cursor: pointer; }
      tr.clickable:hover { background: var(--ct-color-primary-soft); }
      code { font-family: var(--ct-font-mono); }
    `,
  ],
})
export class CcmExceptionsPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  private readonly router = inject(Router);
  readonly page = signal<CcmExceptionPage | null>(null);
  readonly columns = ['control', 'summary', 'criticality', 'status'];

  ngOnInit(): void {
    this.facade.listExceptions().subscribe((p) => this.page.set(p));
  }

  /** Ouvre le détail de l'exception (ligne entière cliquable). */
  open(exc: { id: string }): void {
    this.router.navigate(['/ccm/exceptions', exc.id]);
  }
}
