import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MissionPage } from '../../../libs/api-clients/missions';
import { MissionsFacade } from '../missions.facade';

/**
 * Liste des missions (archétype LISTE, §8) : recherche + pagination **côté serveur**, reflétées dans
 * l'URL (`?q=&page=`, partageable). Le serveur filtre selon le périmètre (feature `mission.read`).
 */
@Component({
  selector: 'ct-missions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <h1>Missions</h1>
      <form class="filters" (submit)="$event.preventDefault(); search(searchInput.value)">
        <input #searchInput type="search" name="q" [value]="query()" placeholder="Rechercher…" aria-label="Rechercher" />
        <button type="submit">Rechercher</button>
      </form>
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
          <p>Aucune mission pour ces critères.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class MissionsPage implements OnInit {
  private readonly facade = inject(MissionsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<MissionPage | null>(null);
  readonly query = signal<string>('');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const index = Math.max(0, Number(params.get('page') ?? 0) || 0);
      const q = params.get('q') ?? '';
      this.query.set(q);
      this.facade.list(index, 20, q || undefined).subscribe((p) => this.page.set(p));
    });
  }

  go(index: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: index },
      queryParamsHandling: 'merge',
    });
  }

  search(value: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null, page: 0 },
      queryParamsHandling: 'merge',
    });
  }
}
