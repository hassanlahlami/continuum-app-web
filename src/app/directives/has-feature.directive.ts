import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { PermissionsStore } from '../permissions.store';

/**
 * Directive structurelle `*hasFeature` (plan §4.2) : n'affiche son contenu que si l'utilisateur
 * détient la fonctionnalité (d'après `/me/permissions`). Confort d'affichage ; le serveur reste la
 * vraie protection (D32). Réagit au chargement des droits via un `effect` sur le store (signaux).
 */
@Directive({ selector: '[hasFeature]', standalone: true })
export class HasFeatureDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly store = inject(PermissionsStore);
  private readonly code = signal<string>('');
  private rendered = false;

  @Input({ required: true })
  set hasFeature(featureCode: string) {
    this.code.set(featureCode);
  }

  constructor() {
    effect(() => {
      const allowed = this.store.has(this.code());
      if (allowed && !this.rendered) {
        this.vcr.createEmbeddedView(this.tpl);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.vcr.clear();
        this.rendered = false;
      }
    });
  }
}
