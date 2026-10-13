import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CcmExceptionPage } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';

/**
 * Flux d'exceptions du contrôle continu (CCM, §5.3, D34) : le moteur produit des <strong>exceptions</strong>
 * à trier (jamais des constats). Le serveur applique le périmètre ({@code ccm.read}) et renvoie les
 * exceptions ; le front affiche et renvoie vers le détail pour le triage (D32).
 */
@Component({
  selector: 'ct-ccm-exceptions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <h1>Exceptions CCM</h1>
      <p>
        Exceptions détectées par le contrôle continu (§5.3), à trier par un auditeur habilité.
        <a routerLink="/ccm/controls" data-cy="ccm-controls-link">Bibliothèque de contrôles →</a>
      </p>
      @if (page(); as p) {
        @if (p.items.length) {
          <table data-cy="ccm-exceptions-table">
            <thead>
              <tr><th>Contrôle</th><th>Résumé</th><th>Criticité</th><th>Statut</th></tr>
            </thead>
            <tbody>
              @for (exc of p.items; track exc.id) {
                <tr data-cy="ccm-row">
                  <td><code>{{ exc.controlCode }}</code></td>
                  <td><a [routerLink]="['/ccm/exceptions', exc.id]" data-cy="ccm-exc-link">{{ exc.summary || '—' }}</a></td>
                  <td>{{ exc.criticality?.label ?? '—' }}</td>
                  <td data-cy="ccm-exc-status">{{ exc.status.label }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p data-cy="ccm-empty">Aucune exception à trier.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmExceptionsPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  readonly page = signal<CcmExceptionPage | null>(null);

  ngOnInit(): void {
    this.facade.listExceptions().subscribe((p) => this.page.set(p));
  }
}
