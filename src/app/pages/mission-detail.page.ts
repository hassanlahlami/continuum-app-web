import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Mission } from '../../../libs/api-clients/missions';
import { MissionsFacade } from '../missions.facade';

/**
 * Fiche mission (archétype FICHE, §8) : identité, statut/phase, avancement. Les actions viendront de
 * `availableActions` renvoyé par le serveur (D32) ; onglets et historique à suivre.
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
          <h1>{{ m.title }}</h1>
          <p><code>{{ m.reference }}</code> · {{ m.status.label }} · {{ m.phase.label }}</p>
        </header>
        <dl>
          <dt>Type</dt><dd>{{ m.missionType.label }}</dd>
          @if (m.unit; as unit) { <dt>Unité</dt><dd>{{ unit.label }}</dd> }
          <dt>Avancement</dt><dd>{{ m.progressPercent ?? 0 }}%</dd>
        </dl>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class MissionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(MissionsFacade);
  readonly mission = signal<Mission | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.get(id).subscribe((m) => this.mission.set(m));
    }
  }
}
