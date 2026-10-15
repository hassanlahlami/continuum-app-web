import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { HasFeatureDirective } from '../directives/has-feature.directive';
import { PermissionsStore } from '../permissions.store';

/**
 * Page « Mes droits » (archétype proche de TABLEAU DE BORD, §1.5/§8) : liste les fonctionnalités
 * effectives et leurs portées (`/me/permissions`, §2.1.7), via {@link PermissionsStore}. Composants
 * Material habillés par les tokens --ct-*.
 */
@Component({
  selector: 'ct-my-permissions',
  standalone: true,
  imports: [RouterLink, HasFeatureDirective, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <h1>Mes droits</h1>
      <nav class="quick-nav" data-cy="home-nav">
        <a mat-stroked-button routerLink="/missions" *hasFeature="'mission.read'">
          <mat-icon>folder_open</mat-icon> Missions
        </a>
        <a mat-stroked-button routerLink="/findings" *hasFeature="'finding.read'">
          <mat-icon>flag</mat-icon> Constats
        </a>
        <a mat-stroked-button routerLink="/ccm" *hasFeature="'finding.read'">
          <mat-icon>rule</mat-icon> Exceptions CCM
        </a>
      </nav>

      @if (store.permissions(); as p) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title>Fonctionnalités effectives</mat-card-title>
            <mat-card-subtitle>Version d'habilitation : {{ p.authzVersion }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul class="perms">
              @for (feature of p.features; track feature.code) {
                <li data-cy="permission-item">
                  <code>{{ feature.code }}</code>
                  <mat-chip-set>
                    @for (scope of feature.scopes; track scope.type + '/' + scope.id) {
                      <mat-chip disableRipple>{{ scope.type }}@if (scope.label) { — {{ scope.label }} }</mat-chip>
                    }
                  </mat-chip-set>
                </li>
              } @empty {
                <li>Aucun droit.</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .quick-nav { display: flex; flex-wrap: wrap; gap: var(--ct-space-2); margin-bottom: var(--ct-space-4); }
      .block { margin-top: var(--ct-space-2); }
      code { font-family: var(--ct-font-mono); }
      .perms { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ct-space-3); }
      .perms li { display: flex; align-items: center; gap: var(--ct-space-3); flex-wrap: wrap; }
    `,
  ],
})
export class MyPermissionsPage implements OnInit {
  protected readonly store = inject(PermissionsStore);

  ngOnInit(): void {
    this.store.ensureLoaded().subscribe();
  }
}
