import { Component, OnInit, inject, signal } from '@angular/core';
import { FindingPage } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Exceptions du contrôle continu (CCM, §5) : les constats générés automatiquement (source {@code CCM})
 * — cumuls SoD, anomalies détectées. Le serveur filtre (source=CCM) et applique le périmètre ; le
 * front affiche (D32).
 */
@Component({
  selector: 'ct-ccm-exceptions',
  standalone: true,
  template: `
    <section>
      <h1>Exceptions CCM</h1>
      <p>Constats générés automatiquement par le contrôle continu (§5).</p>
      @if (page(); as p) {
        @if (p.items.length) {
          <table>
            <thead>
              <tr><th>Référence</th><th>Titre</th><th>Criticité</th><th>Statut</th></tr>
            </thead>
            <tbody>
              @for (finding of p.items; track finding.id) {
                <tr>
                  <td><code>{{ finding.reference }}</code></td>
                  <td>{{ finding.title }}</td>
                  <td>{{ finding.criticality?.label ?? '—' }}</td>
                  <td>{{ finding.status.label }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p>Aucune exception CCM.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmExceptionsPage implements OnInit {
  private readonly facade = inject(FindingsFacade);
  readonly page = signal<FindingPage | null>(null);

  ngOnInit(): void {
    this.facade.searchCcm().subscribe((p) => this.page.set(p));
  }
}
