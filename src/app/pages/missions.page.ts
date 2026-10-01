import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MissionPage } from '../../../libs/api-clients/missions';
import { MissionsFacade } from '../missions.facade';

/**
 * Liste des missions (archétype LISTE, §8) : missions du périmètre, pagination **côté serveur**
 * (`page`/`size`). Tri et filtres serveur à brancher ; reflet dans l'URL à suivre.
 */
@Component({
  selector: 'ct-missions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <h1>Missions</h1>
      @if (page(); as p) {
        @if (p.items.length) {
          <table>
            <thead>
              <tr><th>Référence</th><th>Titre</th><th>Statut</th><th>Avancement</th></tr>
            </thead>
            <tbody>
              @for (mission of p.items; track mission.id) {
                <tr>
                  <td><a [routerLink]="['/missions', mission.id]"><code>{{ mission.reference }}</code></a></td>
                  <td>{{ mission.title }}</td>
                  <td>{{ mission.status.label }}</td>
                  <td>{{ mission.progressPercent ?? 0 }}%</td>
                </tr>
              }
            </tbody>
          </table>
          <nav class="pager">
            <button type="button" (click)="go(p.page - 1)" [disabled]="p.page <= 0">Précédent</button>
            <span>Page {{ p.page + 1 }} / {{ p.totalPages }}</span>
            <button type="button" (click)="go(p.page + 1)" [disabled]="p.page + 1 >= p.totalPages">Suivant</button>
          </nav>
        } @else {
          <p>Aucune mission — créer un plan d'audit.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class MissionsPage implements OnInit {
  private readonly facade = inject(MissionsFacade);
  readonly page = signal<MissionPage | null>(null);

  ngOnInit(): void {
    this.go(0);
  }

  go(index: number): void {
    this.facade.list(index).subscribe((p) => this.page.set(p));
  }
}
