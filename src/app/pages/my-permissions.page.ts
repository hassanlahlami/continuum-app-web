import { Component, OnInit, inject, signal } from '@angular/core';
import { Permissions } from '../../../libs/api-clients/me';
import { MeFacade } from '../me.facade';

/**
 * Page « Mes droits » (archétype proche de TABLEAU DE BORD, §1.5/§8) : liste les fonctionnalités
 * effectives et leurs portées, telles que renvoyées par le serveur (`/me/permissions`, §2.1.7).
 * Le front n'applique aucune règle de sécurité : il affiche ce que le serveur accorde (D32).
 */
@Component({
  selector: 'ct-my-permissions',
  standalone: true,
  template: `
    <section>
      <h1>Mes droits</h1>
      @if (permissions(); as p) {
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
  private readonly facade = inject(MeFacade);
  readonly permissions = signal<Permissions | null>(null);

  ngOnInit(): void {
    this.facade.permissions().subscribe((p) => this.permissions.set(p));
  }
}
