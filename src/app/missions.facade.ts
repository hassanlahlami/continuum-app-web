import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Mission, MissionPage, MissionsService } from '../../libs/api-clients/missions';

/** Façade du module « missions » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class MissionsFacade {
  private readonly api = inject(MissionsService);

  list(page = 0, size = 20, opts: { q?: string; from?: string; to?: string; mine?: boolean } = {}): Observable<MissionPage> {
    return this.api.listMissions(
      page,
      size,
      undefined, // sort
      opts.q || undefined,
      undefined, // status
      undefined, // unitId
      opts.from || undefined,
      opts.to || undefined,
      undefined, // missionTypeCode
      undefined, // auditPlanId
      opts.mine || undefined,
    );
  }

  get(missionId: string): Observable<Mission> {
    return this.api.getMission(missionId);
  }
}
