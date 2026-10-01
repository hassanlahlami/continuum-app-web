import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Mission, MissionPage, MissionsService } from '../../libs/api-clients/missions';

/** Façade du module « missions » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class MissionsFacade {
  private readonly api = inject(MissionsService);

  list(page = 0, size = 20): Observable<MissionPage> {
    return this.api.listMissions(page, size);
  }

  get(missionId: string): Observable<Mission> {
    return this.api.getMission(missionId);
  }
}
