import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Me, MeService, Permissions } from '../../libs/api-clients/me';

/**
 * Façade du module « me » : le front consomme uniquement le client généré depuis le contrat (D32).
 * Aucun appel HTTP écrit à la main, aucune règle de sécurité ici — le serveur décide.
 */
@Injectable({ providedIn: 'root' })
export class MeFacade {
  private readonly api = inject(MeService);

  currentUser(): Observable<Me> {
    return this.api.getCurrentUser();
  }

  permissions(): Observable<Permissions> {
    return this.api.getMyPermissions();
  }
}
