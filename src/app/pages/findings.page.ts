import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { FindingPage } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Vue transverse des constats (archétype LISTE, §8) : tous les constats du périmètre
 * (`GET /findings`, feature `finding.read`). Composants Material habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-findings',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatChipsModule],
  template: `
    <section>
      <h1>Constats</h1>
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
                <td mat-cell *matCellDef="let f">{{ f.criticality?.label ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip-set><mat-chip disableRipple>{{ f.status.label }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <ng-container matColumnDef="mission">
                <th mat-header-cell *matHeaderCellDef>Mission</th>
                <td mat-cell *matCellDef="let f">{{ f.missionTitle ?? '—' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="finding-row"></tr>
            </table>
          </mat-card>
        } @else {
          <p>Aucun constat.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .table-card { padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      code { font-family: var(--ct-font-mono); }
    `,
  ],
})
export class FindingsPage implements OnInit {
  private readonly facade = inject(FindingsFacade);
  readonly page = signal<FindingPage | null>(null);
  readonly columns = ['reference', 'title', 'criticality', 'status', 'mission'];

  ngOnInit(): void {
    this.facade.search().subscribe((p) => this.page.set(p));
  }
}
