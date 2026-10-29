import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Finding, FindingPage, HistoryEntry, FindingsService } from '../../libs/api-clients/findings';

/** Façade du module « constats » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class FindingsFacade {
  private readonly api = inject(FindingsService);

  /** Vue transverse filtrée (serveur) : recherche libre, source, criticité, plage de dates (§8). */
  search(opts: { q?: string; source?: 'MANUAL' | 'CCM'; criticality?: string; from?: string; to?: string } = {}): Observable<FindingPage> {
    return this.api.searchFindings(
      undefined, // page
      undefined, // size
      undefined, // sort
      opts.q || undefined,
      undefined, // status
      undefined, // unitId
      opts.from || undefined,
      opts.to || undefined,
      opts.criticality || undefined,
      undefined, // riskFamilyCode
      opts.source || undefined,
    );
  }

  /** Exceptions issues du contrôle continu (constats de source CCM), §5. */
  searchCcm(): Observable<FindingPage> {
    return this.api.searchFindings(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, 'CCM');
  }

  /** Constats d'une mission (périmètre appliqué par le serveur), §6. */
  listByMission(missionId: string): Observable<Finding[]> {
    return this.api.listMissionFindings(missionId);
  }

  /** Détail (FRAP) d'un constat d'une mission, §6. */
  get(missionId: string, findingId: string): Observable<Finding> {
    return this.api.getFinding(missionId, findingId);
  }

  /** Historique d'un constat (versions, revue, validation). */
  history(missionId: string, findingId: string): Observable<HistoryEntry[]> {
    return this.api.getFindingHistory(missionId, findingId);
  }

  /**
   * Exécute une action décidée par le serveur sur un constat (§2.1.4) — ex. {@code validate}. Le code
   * et la disponibilité viennent de {@code availableActions} ; le front n'invente aucune règle (D32).
   */
  performAction(
    missionId: string,
    findingId: string,
    actionCode: string,
    version: number,
    comment?: string,
  ): Observable<Finding> {
    return this.api.performFindingAction(missionId, findingId, actionCode, { version, comment });
  }
}
