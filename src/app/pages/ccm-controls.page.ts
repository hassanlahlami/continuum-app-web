import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CcmControl } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_CATEGORY_LABELS, CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Bibliothèque de contrôles du contrôle continu (CCM, §5) : liste des contrôles de la plateforme
 * (activés ou non pour le tenant), filtrable par recherche libre, catégorie et activation. Le serveur
 * applique le périmètre ({@code ccm.read}) et renvoie l'état de santé ; le front affiche et renvoie vers
 * la fiche (D32). Lecture seule : le paramétrage (maker-checker) et l'exécution viennent plus tard.
 */
@Component({
  selector: 'ct-ccm-controls',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <h1>Bibliothèque de contrôles</h1>
      <p>
        Contrôles du contrôle continu (§5), activés ou non pour l'entité.
        <a routerLink="/ccm" data-cy="ccm-exceptions-link">Voir le flux d'exceptions →</a>
      </p>

      <form class="filters" (submit)="$event.preventDefault(); reload()">
        <label>Recherche
          <input data-cy="ccm-controls-search" [value]="q()" (input)="q.set($any($event.target).value)" />
        </label>
        <label>Catégorie
          <select data-cy="ccm-controls-category" [value]="category() ?? ''" (change)="onCategory($any($event.target).value)">
            <option value="">Toutes</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ categoryLabel(c) }}</option>
            }
          </select>
        </label>
        <label>État
          <select data-cy="ccm-controls-active" [value]="activeFilter()" (change)="onActive($any($event.target).value)">
            <option value="">Tous</option>
            <option value="true">Activés</option>
            <option value="false">Désactivés</option>
          </select>
        </label>
        <button type="submit" data-cy="ccm-controls-apply">Filtrer</button>
      </form>

      @if (controls(); as list) {
        @if (list.length) {
          <table data-cy="ccm-controls-table">
            <thead>
              <tr><th>Code</th><th>Contrôle</th><th>Catégorie</th><th>État</th><th>Santé</th></tr>
            </thead>
            <tbody>
              @for (ctl of list; track ctl.id) {
                <tr data-cy="ccm-control-row">
                  <td><code>{{ ctl.code }}</code></td>
                  <td>
                    <a [routerLink]="['/ccm/controls', ctl.id]" data-cy="ccm-control-link">{{ ctl.label }}</a>
                  </td>
                  <td>{{ categoryLabel(ctl.category) }}</td>
                  <td data-cy="ccm-control-active">{{ ctl.active ? 'Activé' : 'Désactivé' }}</td>
                  <td>
                    <span class="badge" [attr.data-cy]="'ccm-control-health'" [attr.data-health]="ctl.health">
                      {{ healthLabel(ctl.health) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p data-cy="ccm-controls-empty">Aucun contrôle ne correspond aux filtres.</p>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmControlsPage implements OnInit {
  private readonly facade = inject(CcmFacade);
  readonly controls = signal<CcmControl[] | null>(null);
  readonly q = signal('');
  readonly category = signal<CcmControl.CategoryEnum | null>(null);
  readonly activeFilter = signal<'' | 'true' | 'false'>('');
  readonly categories = Object.values(CcmControl.CategoryEnum);

  ngOnInit(): void {
    this.reload();
  }

  onCategory(value: string): void {
    this.category.set(value ? (value as CcmControl.CategoryEnum) : null);
    this.reload();
  }

  onActive(value: string): void {
    this.activeFilter.set(value === 'true' || value === 'false' ? value : '');
    this.reload();
  }

  reload(): void {
    const active = this.activeFilter() === '' ? undefined : this.activeFilter() === 'true';
    this.facade
      .listControls(this.q().trim() || undefined, this.category() ?? undefined, active)
      .subscribe((list) => this.controls.set(list));
  }

  categoryLabel(c: CcmControl.CategoryEnum): string {
    return CCM_CATEGORY_LABELS[c] ?? c;
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }
}
