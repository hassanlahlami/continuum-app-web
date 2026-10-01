import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { Permissions } from '../../libs/api-clients/me';
import { MeFacade } from './me.facade';

/**
 * État des droits effectifs de l'utilisateur (base de `GET /me/permissions`, §2.1.7).
 * Chargé une seule fois ; sert aux gardes de route et à l'affichage conditionnel.
 * Le front n'invente aucun droit : il reflète ce que le serveur renvoie (D32).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsStore {
  private readonly facade = inject(MeFacade);
  private readonly state = signal<Permissions | null>(null);
  private cached?: Observable<Permissions>;

  readonly permissions = this.state.asReadonly();

  /** Charge les droits une seule fois (mémoïsé) et met à jour l'état. */
  ensureLoaded(): Observable<Permissions> {
    if (!this.cached) {
      this.cached = this.facade.permissions().pipe(
        tap((p) => this.state.set(p)),
        shareReplay(1),
      );
    }
    return this.cached;
  }

  /** L'utilisateur détient-il la fonctionnalité (toutes portées confondues) ? */
  has(featureCode: string): boolean {
    return (this.state()?.features ?? []).some((f) => f.code === featureCode);
  }
}
