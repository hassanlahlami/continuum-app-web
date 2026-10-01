import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HasFeatureDirective } from '../directives/has-feature.directive';
import { PermissionsStore } from '../permissions.store';

/**
 * Page « Mes droits » (archétype proche de TABLEAU DE BORD, §1.5/§8) : liste les fonctionnalités
 * effectives et leurs portées (`/me/permissions`, §2.1.7), via {@link PermissionsStore}.
 */
@Component({
  selector: 'ct-my-permissions',
  standalone: true,
  imports: [RouterLink, HasFeatureDirective],
  template: `
    <section>
      <h1>Mes droits</h1>
      <a routerLink="/missions" *hasFeature="'mission.read'">Voir les missions</a>
      @if (store.permissions(); as p) {
        <p>Version d'habilitation : {{ p.authzVersion }}</p>
        <ul>
          @for (feature of p.features; track feature.code) {
            <li>
              <code>{{ feature.code }}</code>
              @for (scope of feature.scopes; track scope.type + '/' + scope.id) {
                <span class="scope">{{ scope.type }}@if (scope.label) { — {{ scope.label }} }</span>
              }
            </li>
          } @empty {
            <li>Aucun droit.</li>
          }
        </ul>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class MyPermissionsPage implements OnInit {
  protected readonly store = inject(PermissionsStore);

  ngOnInit(): void {
    this.store.ensureLoaded().subscribe();
  }
}
