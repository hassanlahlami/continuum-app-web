import { Component, OnInit, inject, signal } from '@angular/core';
import { Me } from '../../libs/api-clients/me';
import { MeFacade } from './me.facade';

/**
 * Coquille applicative minimale (§1.2) : affiche l'utilisateur courant obtenu via le client généré.
 * Les libellés/valeurs visuelles définitives viendront des tokens `--ct-*` et de l'i18n (§1.6).
 */
@Component({
  selector: 'ct-root',
  standalone: true,
  template: `
    @if (me(); as user) {
      <header>
        <strong>{{ user.user.displayName }}</strong>
        <span>{{ user.entity.label }}</span>
      </header>
      <ul>
        @for (a of user.assignments; track a.positionLabel) {
          <li>{{ a.positionLabel }}</li>
        }
      </ul>
    } @else {
      <p>Chargement…</p>
    }
  `,
})
export class AppComponent implements OnInit {
  private readonly facade = inject(MeFacade);
  readonly me = signal<Me | null>(null);

  ngOnInit(): void {
    this.facade.currentUser().subscribe((user) => this.me.set(user));
  }
}
