import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Finding } from '../../../libs/api-clients/findings';
import { Mission } from '../../../libs/api-clients/missions';
import { FindingsFacade } from '../findings.facade';
import { MissionsFacade } from '../missions.facade';

/**
 * Fiche mission (archétype FICHE, §8) : identité, statut/phase, avancement, et ses constats (périmètre
 * appliqué par le serveur). Les actions viendront de `availableActions` (D32) ; onglets à suivre.
 */
@Component({
  selector: 'ct-mission-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <a routerLink="/missions">← Missions</a>
      @if (mission(); as m) {
        <header>
          <h1 data-cy="mission-title">{{ m.title }}</h1>
          <p><code>{{ m.reference }}</code> · {{ m.status.label }} · {{ m.phase.label }}</p>
        </header>
        <dl>
          <dt>Type</dt><dd>{{ m.missionType.label }}</dd>
          @if (m.unit; as unit) { <dt>Unité</dt><dd>{{ unit.label }}</dd> }
          <dt>Avancement</dt><dd>{{ m.progressPercent ?? 0 }}%</dd>
        </dl>

        <h2>Constats</h2>
        @if (findings().length) {
          <table data-cy="mission-findings">
            <thead>
              <tr><th>Référence</th><th>Titre</th><th>Criticité</th><th>Statut</th></tr>
            </thead>
            <tbody>
              @for (f of findings(); track f.id) {
                <tr data-cy="finding-row">
                  <td><a [routerLink]="['/missions', missionId, 'findings', f.id]" data-cy="finding-link"><code>{{ f.reference }}</code></a></td>
                  <td>{{ f.title }}</td>
                  <td>{{ f.criticality?.label ?? '—' }}</td>
                  <td>{{ f.status.label }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p>Aucun constat sur cette mission.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class MissionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(MissionsFacade);
  private readonly findingsFacade = inject(FindingsFacade);
  readonly mission = signal<Mission | null>(null);
  readonly findings = signal<Finding[]>([]);
  missionId = '';

  ngOnInit(): void {
    this.missionId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.missionId) {
      this.facade.get(this.missionId).subscribe((m) => this.mission.set(m));
      this.findingsFacade.listByMission(this.missionId).subscribe((fs) => this.findings.set(fs));
    }
  }
}
