import { Component } from '@angular/core';

/** Placeholder de la liste des missions (archétype LISTE, vague 1) — protégé par `mission.read`. */
@Component({
  selector: 'ct-missions',
  standalone: true,
  template: `
    <section>
      <h1>Missions</h1>
      <p>Liste des missions (à venir).</p>
    </section>
  `,
})
export class MissionsPage {}
