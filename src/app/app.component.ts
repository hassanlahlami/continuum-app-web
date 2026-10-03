import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Me } from '../../libs/api-clients/me';
import { ApiErrorStore } from './errors/api-error.store';
import { MeFacade } from './me.facade';

/**
 * Coquille applicative (§1.2) : en-tête (utilisateur courant, entité) + zone de contenu routée.
 * Valeurs visuelles définitives via tokens `--ct-*` et i18n (§1.6).
 */
@Component({
  selector: 'ct-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="app-bar">
      <div class="brand">Continuum</div>
      <div class="spacer"></div>
      @if (me(); as user) {
        <div class="user">
          <strong>{{ user.user.displayName }}</strong>
          <span>{{ user.entity.label }}</span>
        </div>
      }
    </header>
    @if (errors.error(); as e) {
      <div class="api-error" role="alert">
        {{ e.message }}
        @if (e.traceId) { <small>(réf. {{ e.traceId }})</small> }
        <button type="button" (click)="errors.clear()" aria-label="Fermer">×</button>
      </div>
    }
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent implements OnInit {
  private readonly facade = inject(MeFacade);
  protected readonly errors = inject(ApiErrorStore);
  readonly me = signal<Me | null>(null);

  ngOnInit(): void {
    this.facade.currentUser().subscribe((user) => this.me.set(user));
  }
}
