import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActionRequest,
  CcmControl,
  CcmControlsService,
  CcmException,
  CcmExceptionPage,
  CcmExceptionsService,
  CcmOverview,
  CcmOverviewService,
  CcmRunPage,
  CcmRunsService,
  ConvertCcmExceptionToFinding201Response,
} from '../../libs/api-clients/ccm';

/**
 * Façade des modules CCM (§5, §5.3, D34) : consomme les clients générés (D32). Le front n'invente
 * aucune règle — le périmètre, le statut et les actions ({@code availableActions}) viennent du serveur.
 */
@Injectable({ providedIn: 'root' })
export class CcmFacade {
  private readonly api = inject(CcmExceptionsService);
  private readonly controls = inject(CcmControlsService);
  private readonly overview = inject(CcmOverviewService);
  private readonly runs = inject(CcmRunsService);

  /** Vue d'ensemble du cockpit (§5) : santé des contrôles, exceptions ouvertes/à trier, tendance. */
  getOverview(): Observable<CcmOverview> {
    return this.overview.getCcmOverview();
  }

  /** Historique des exécutions d'un contrôle (§5, plus récentes d'abord ; périmètre appliqué serveur). */
  listControlRuns(controlId: string, page = 0, size = 10): Observable<CcmRunPage> {
    return this.runs.listCcmControlRuns(controlId, page, size);
  }

  /** Bibliothèque de contrôles (§5), filtrable ; le périmètre ({@code ccm.read}) est appliqué par le serveur. */
  listControls(q?: string, category?: CcmControl.CategoryEnum, active?: boolean): Observable<CcmControl[]> {
    return this.controls.listCcmControls(q, category, active);
  }

  /** Fiche d'un contrôle (règle, paramètres métier, planification, référence normative). */
  getControl(controlId: string): Observable<CcmControl> {
    return this.controls.getCcmControl(controlId);
  }

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
