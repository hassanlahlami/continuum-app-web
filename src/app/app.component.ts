import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Me } from '../../libs/api-clients/me';
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
    <header>
      @if (me(); as user) {
        <strong>{{ user.user.displayName }}</strong>
        <span>· {{ user.entity.label }}</span>
      }
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent implements OnInit {
  private readonly facade = inject(MeFacade);
  readonly me = signal<Me | null>(null);

  ngOnInit(): void {
    this.facade.currentUser().subscribe((user) => this.me.set(user));
  }
}
