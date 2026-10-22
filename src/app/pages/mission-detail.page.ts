import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Finding } from '../../../libs/api-clients/findings';
import { Mission } from '../../../libs/api-clients/missions';
import { FindingsFacade } from '../findings.facade';
import { MissionsFacade } from '../missions.facade';

/**
 * Cockpit de mission (archétype FICHE, §8) : identité, cadrage (type, unité, responsable, période,
 * périmètre, entités auditées), indicateurs (avancement, constats, tâches en retard) et la liste de ses
 * constats — le périmètre est appliqué par le serveur (D32). Composants Material / tokens --ct-*.
 */
@Component({
  selector: 'ct-mission-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <section>
      <a mat-button routerLink="/missions"><mat-icon>arrow_back</mat-icon> Missions</a>
      @if (mission(); as m) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title data-cy="mission-title">{{ m.title }}</mat-card-title>
            <mat-card-subtitle><code>{{ m.reference }}</code> · {{ m.missionType.label }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple data-cy="mission-status">{{ m.status.label }}</mat-chip>
              <mat-chip disableRipple>{{ m.phase.label }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <div class="kpis" data-cy="mission-kpis">
          <mat-card appearance="outlined" class="kpi">
            <mat-icon class="kpi-ic">trending_up</mat-icon>
            <strong>{{ m.progressPercent ?? 0 }}%</strong><span>Avancement</span>
            <mat-progress-bar mode="determinate" [value]="m.progressPercent ?? 0" aria-label="Avancement"></mat-progress-bar>
          </mat-card>
          <mat-card appearance="outlined" class="kpi">
            <mat-icon class="kpi-ic">flag</mat-icon>
            <strong>{{ m.findingsCount ?? findings().length }}</strong><span>Constats</span>
          </mat-card>
          <mat-card appearance="outlined" class="kpi" [class.alert]="(m.overdueTasksCount ?? 0) > 0" data-cy="mission-overdue">
            <mat-icon class="kpi-ic">schedule</mat-icon>
            <strong>{{ m.overdueTasksCount ?? 0 }}</strong><span>Tâches en retard</span>
          </mat-card>
        </div>

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Cadrage</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl class="meta">
              @if (m.unit; as unit) { <dt>Unité</dt><dd>{{ unit.label }}</dd> }
              @if (m.lead; as lead) {
                <dt>Responsable</dt>
                <dd>{{ lead.displayName }}@if (lead.positionLabel) { <span class="muted"> · {{ lead.positionLabel }}</span> }</dd>
              }
              <dt>Période</dt>
              <dd>
                {{ m.plannedStart ? (m.plannedStart | date: 'dd/MM/yyyy') : '—' }}
                <span class="muted">→</span>
                {{ m.plannedEnd ? (m.plannedEnd | date: 'dd/MM/yyyy') : '—' }}
              </dd>
            </dl>
            @if (m.scope) {
              <div class="mission-scope" data-cy="mission-scope">
                <span class="meta-label">Périmètre</span>
                <p>{{ m.scope }}</p>
              </div>
            }
            @if (m.auditedEntities?.length) {
              <div class="entities">
                <span class="meta-label">Entités auditées</span>
                <mat-chip-set data-cy="mission-entities">
                  @for (e of m.auditedEntities; track e.id) { <mat-chip disableRipple>{{ e.label }}</mat-chip> }
                </mat-chip-set>
              </div>
            }
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
                <td mat-cell *matCellDef="let f">
                  @if (f.criticality; as c) {
                    <mat-chip-set><mat-chip disableRipple [attr.data-criticality]="c.code">{{ c.label }}</mat-chip></mat-chip-set>
                  } @else { — }
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip-set><mat-chip disableRipple [attr.data-status]="f.status.code">{{ f.status.label }}</mat-chip></mat-chip-set>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="finding-row"></tr>
            </table>
          } @else {
            <mat-card-content><p data-cy="mission-findings-empty">Aucun constat sur cette mission.</p></mat-card-content>
          }
        </mat-card>
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      table[mat-table] { width: 100%; background: transparent; }
      code { font-family: var(--ct-font-mono); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: var(--ct-space-3); margin-top: var(--ct-space-4); }
      .kpi { padding: var(--ct-space-4); text-align: center; }
      .kpi-ic { color: var(--ct-color-muted); margin-bottom: var(--ct-space-1); }
      .kpi strong { display: block; font-size: 1.8rem; font-weight: 700; color: var(--ct-color-primary); line-height: 1.1; }
      .kpi span { color: var(--ct-color-muted); font-size: 0.82rem; }
      .kpi mat-progress-bar { margin-top: var(--ct-space-2); }
      .kpi.alert strong, .kpi.alert .kpi-ic { color: var(--ct-amber-700); }
      .meta { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-2) var(--ct-space-4); margin: 0; }
      .meta dt { color: var(--ct-color-muted); align-self: center; } .meta dd { margin: 0; font-weight: 600; }
      .muted { color: var(--ct-color-muted); font-weight: 400; }
      .meta-label { display: block; color: var(--ct-color-muted); font-size: 0.8rem; margin-bottom: var(--ct-space-1); }
      .mission-scope { margin-top: var(--ct-space-4); }
      .mission-scope p { margin: 0; max-width: 80ch; }
      .entities { margin-top: var(--ct-space-4); }
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
