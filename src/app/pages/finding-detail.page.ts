import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Finding } from '../../../libs/api-clients/findings';
import { FindingsFacade } from '../findings.facade';

/**
 * Détail d'un constat — la FRAP (archétype FICHE, §6/§8) : Fait, Critère, Cause, Conséquence, plus
 * statut et criticité. Le périmètre (`finding.read`) est appliqué par le serveur (D32) ; 404 sinon.
 */
@Component({
  selector: 'ct-finding-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <a [routerLink]="['/missions', missionId]">← Mission</a>
      @if (finding(); as f) {
        <header>
          <h1>{{ f.title }}</h1>
          <p>
            <code>{{ f.reference }}</code> · {{ f.status.label }}
            @if (f.criticality; as c) { · Criticité : {{ c.label }} }
          </p>
        </header>
        <dl>
          <dt>Fait</dt><dd>{{ f.fact || '—' }}</dd>
          <dt>Critère</dt><dd>{{ f.criterion || '—' }}</dd>
          <dt>Cause</dt><dd>{{ f.cause || '—' }}</dd>
          <dt>Conséquence</dt><dd>{{ f.consequence || '—' }}</dd>
        </dl>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class FindingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(FindingsFacade);
  readonly finding = signal<Finding | null>(null);
  missionId = '';

  ngOnInit(): void {
    this.missionId = this.route.snapshot.paramMap.get('missionId') ?? '';
    const findingId = this.route.snapshot.paramMap.get('findingId');
    if (this.missionId && findingId) {
      this.facade.get(this.missionId, findingId).subscribe((f) => this.finding.set(f));
    }
  }
}
