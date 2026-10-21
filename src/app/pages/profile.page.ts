import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Me } from '../../../libs/api-clients/me';
import { MeFacade } from '../me.facade';
import { ThemeService, ThemePref } from '../theme.service';

/**
 * Profil & préférences de l'utilisateur (§1.2) : identité lue sur `/me` (lecture seule) et préférences
 * locales par navigateur (thème). Style « épuré & dense » : grille libellé/valeur serrée. Les droits
 * et l'affectation viennent du serveur ; aucune écriture de profil côté MVP.
 */
@Component({
  selector: 'ct-profile',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule],
  template: `
    <section>
      <h1>Profil & préférences</h1>
      @if (me(); as m) {
        <mat-card appearance="outlined" class="block" data-cy="profile-identity">
          <mat-card-header><mat-card-title>Identité</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl class="kv">
              <dt>Nom</dt><dd data-cy="profile-name">{{ m.user.displayName }}</dd>
              <dt>Position</dt><dd>{{ m.user.positionLabel ?? '—' }}</dd>
              <dt>Courriel</dt><dd>{{ m.email ?? '—' }}</dd>
              <dt>Entité</dt><dd>{{ m.entity.label }}</dd>
              <dt>Dernière connexion</dt><dd>{{ m.lastLoginAt ? (m.lastLoginAt | date: 'dd/MM/yyyy HH:mm') : '—' }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Préférences</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="pref">
              <span class="pref-label">Thème</span>
              <mat-button-toggle-group [value]="theme()" (change)="setTheme($event.value)"
                                       hideSingleSelectionIndicator data-cy="profile-theme" aria-label="Thème">
                <mat-button-toggle value="auto" data-cy="profile-theme-auto"><mat-icon>brightness_auto</mat-icon> Auto</mat-button-toggle>
                <mat-button-toggle value="light" data-cy="profile-theme-light"><mat-icon>light_mode</mat-icon> Clair</mat-button-toggle>
                <mat-button-toggle value="dark" data-cy="profile-theme-dark"><mat-icon>dark_mode</mat-icon> Sombre</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            <div class="pref">
              <span class="pref-label">Langue</span>
              <span class="muted" data-cy="profile-locale">{{ localeLabel(m.locale) }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-bottom: var(--ct-space-4); max-width: 640px; }
      .kv { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-2) var(--ct-space-5); margin: 0; }
      .kv dt { color: var(--ct-color-muted); font-size: 0.8rem; align-self: center; }
      .kv dd { margin: 0; font-weight: 600; }
      .pref { display: flex; align-items: center; gap: var(--ct-space-4); margin: var(--ct-space-3) 0; }
      .pref-label { color: var(--ct-color-muted); font-size: 0.8rem; min-width: 80px; }
      .muted { color: var(--ct-color-muted); }
      mat-button-toggle mat-icon { font-size: 18px; height: 18px; width: 18px; vertical-align: middle; }
    `,
  ],
})
export class ProfilePage implements OnInit {
  private readonly facade = inject(MeFacade);
  private readonly themeSvc = inject(ThemeService);
  readonly me = signal<Me | null>(null);
  readonly theme = this.themeSvc.theme;

  ngOnInit(): void {
    this.facade.currentUser().subscribe((m) => this.me.set(m));
  }

  setTheme(pref: ThemePref): void {
    this.themeSvc.set(pref);
  }

  localeLabel(locale?: string): string {
    return locale === 'ar' ? 'العربية' : locale === 'en' ? 'English' : 'Français';
  }
}
