import { Injectable, signal } from '@angular/core';

export type ThemePref = 'auto' | 'light' | 'dark';

/**
 * Préférence de thème de l'utilisateur (auto = système, clair, sombre), partagée par la coquille
 * (bascule de la barre supérieure) et la page Profil. Persistée par navigateur (`ct-theme`) et
 * appliquée via `data-theme` sur `<html>` ; le pont theme.scss propage aux tokens --ct-* (§1.6).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemePref>(this.read());

  constructor() {
    this.apply();
  }

  /** Fixe explicitement la préférence. */
  set(pref: ThemePref): void {
    this.theme.set(pref);
    this.persist(pref);
    this.apply();
  }

  /** Cycle auto → clair → sombre → auto (bascule rapide de la barre supérieure). */
  cycle(): void {
    const t = this.theme();
    this.set(t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto');
  }

  /** Icône Material Symbols correspondant à la préférence courante. */
  icon(): string {
    return this.theme() === 'light' ? 'light_mode' : this.theme() === 'dark' ? 'dark_mode' : 'brightness_auto';
  }

  private read(): ThemePref {
    try {
      const v = localStorage.getItem('ct-theme');
      return v === 'light' || v === 'dark' ? v : 'auto';
    } catch {
      return 'auto';
    }
  }

  private persist(pref: ThemePref): void {
    try {
      localStorage.setItem('ct-theme', pref);
    } catch {
      // stockage indisponible (navigation privée) : préférence valable pour la session.
    }
  }

  private apply(): void {
    const el = document.documentElement;
    if (this.theme() === 'auto') {
      delete el.dataset.theme;
    } else {
      el.dataset.theme = this.theme();
    }
  }
}
