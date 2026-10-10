import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Finding, FindingPage, FindingsService } from '../../libs/api-clients/findings';

/** Façade du module « constats » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class FindingsFacade {
  private readonly api = inject(FindingsService);

  search(): Observable<FindingPage> {
    return this.api.searchFindings();
  }

  /** Constats d'une mission (périmètre appliqué par le serveur), §6. */
  listByMission(missionId: string): Observable<Finding[]> {
    return this.api.listMissionFindings(missionId);
  }

  /** Détail (FRAP) d'un constat d'une mission, §6. */
  get(missionId: string, findingId: string): Observable<Finding> {
    return this.api.getFinding(missionId, findingId);
  }
}
