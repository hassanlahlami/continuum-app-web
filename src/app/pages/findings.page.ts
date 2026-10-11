import { Component, OnInit, inject, signal } from '@angular/core';
import { FindingPage } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Vue transverse des constats (archétype LISTE, §8) : tous les constats du périmètre
 * (`GET /findings`, feature `finding.read`). Filtres/criticité côté serveur (à brancher).
 */
@Component({
  selector: 'ct-findings',
  standalone: true,
  template: `
    <section>
      <h1>Constats</h1>
      @if (page(); as p) {
        @if (p.items.length) {
          <table data-cy="findings-table">
            <thead>
              <tr><th>Référence</th><th>Titre</th><th>Criticité</th><th>Statut</th><th>Mission</th></tr>
            </thead>
            <tbody>
              @for (finding of p.items; track finding.id) {
                <tr data-cy="finding-row">
                  <td><code>{{ finding.reference }}</code></td>
                  <td>{{ finding.title }}</td>
                  <td>{{ finding.criticality?.label ?? '—' }}</td>
                  <td>{{ finding.status.label }}</td>
                  <td>{{ finding.missionTitle ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p>Aucun constat.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class FindingsPage implements OnInit {
  private readonly facade = inject(FindingsFacade);
  readonly page = signal<FindingPage | null>(null);

  ngOnInit(): void {
    this.facade.search().subscribe((p) => this.page.set(p));
  }
}
