import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActionRequest,
  CcmException,
  CcmExceptionPage,
  CcmExceptionsService,
  ConvertCcmExceptionToFinding201Response,
} from '../../libs/api-clients/ccm';

/**
 * Façade du module « exceptions CCM » (§5.3, D34) : consomme le client généré (D32). Le front n'invente
 * aucune règle — le périmètre, le statut et les actions ({@code availableActions}) viennent du serveur.
 */
@Injectable({ providedIn: 'root' })
export class CcmFacade {
  private readonly api = inject(CcmExceptionsService);

  /** Flux d'exceptions à trier (filtrable par statut), périmètre appliqué par le serveur. */
  listExceptions(status?: string[]): Observable<CcmExceptionPage> {
    return this.api.listCcmExceptions(undefined, undefined, undefined, status);
  }

  /** Détail d'une exception (jusqu'à l'enregistrement source du CBS). */
  getException(exceptionId: string): Observable<CcmException> {
    return this.api.getCcmException(exceptionId);
  }

  /**
   * Action de triage décidée par le serveur (retenir/écarter/affecter/rouvrir, §5.3). La justification
   * (écart) passe par {@code comment} ; l'affectation par {@code payload.assigneeUserId}. Pas de verrou
   * optimiste depuis l'UI (le contrat {@code CcmException} n'expose pas de version) : le serveur traite
   * {@code version} absent comme « pas de contrôle ».
   */
  performAction(
    exceptionId: string,
    actionCode: string,
    comment?: string,
    payload?: { [key: string]: unknown },
  ): Observable<CcmException> {
    // `version` est requis dans le type généré mais optionnel pour le triage CCM → requête sans version.
    const body = { comment, payload } as ActionRequest;
    return this.api.performCcmExceptionAction(exceptionId, actionCode, body);
  }

  /** Convertit une exception retenue en constat candidat dans une mission (§5.3). */
  convert(exceptionId: string, missionId: string): Observable<ConvertCcmExceptionToFinding201Response> {
    return this.api.convertCcmExceptionToFinding(exceptionId, { missionId });
  }
}
