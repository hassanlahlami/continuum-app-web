import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Finding } from '../../../libs/api-clients/findings';
import { Mission } from '../../../libs/api-clients/missions';
import { FindingsFacade } from '../findings.facade';
import { MissionsFacade } from '../missions.facade';

/**
 * Fiche mission (archétype FICHE, §8) : identité, statut/phase, avancement, et ses constats (périmètre
 * appliqué par le serveur). Composants Material habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-mission-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <a mat-button routerLink="/missions"><mat-icon>arrow_back</mat-icon> Missions</a>
      @if (mission(); as m) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title data-cy="mission-title">{{ m.title }}</mat-card-title>
            <mat-card-subtitle><code>{{ m.reference }}</code></mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple>{{ m.status.label }}</mat-chip>
              <mat-chip disableRipple>{{ m.phase.label }}</mat-chip>
            </mat-chip-set>
            <dl class="meta">
              <dt>Type</dt><dd>{{ m.missionType.label }}</dd>
              @if (m.unit; as unit) { <dt>Unité</dt><dd>{{ unit.label }}</dd> }
              <dt>Avancement</dt><dd>{{ m.progressPercent ?? 0 }}%</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Constats</mat-card-title></mat-card-header>
          @if (findings().length) {
            <table mat-table [dataSource]="findings()" data-cy="mission-findings">
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let f">
                  <a [routerLink]="['/missions', missionId, 'findings', f.id]" data-cy="finding-link"><code>{{ f.reference }}</code></a>
                </td>
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
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="finding-row"></tr>
            </table>
          } @else {
            <mat-card-content><p>Aucun constat sur cette mission.</p></mat-card-content>
          }
        </mat-card>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      table[mat-table] { width: 100%; background: transparent; }
      code { font-family: var(--ct-font-mono); }
      .meta { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-1) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .meta dt { color: var(--ct-color-muted); } .meta dd { margin: 0; }
    `,
  ],
})
export class MissionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(MissionsFacade);
  private readonly findingsFacade = inject(FindingsFacade);
  readonly mission = signal<Mission | null>(null);
  readonly findings = signal<Finding[]>([]);
  readonly columns = ['reference', 'title', 'criticality', 'status'];
  missionId = '';

  ngOnInit(): void {
    this.missionId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.missionId) {
      this.facade.get(this.missionId).subscribe((m) => this.mission.set(m));
      this.findingsFacade.listByMission(this.missionId).subscribe((fs) => this.findings.set(fs));
    }
  }
}
