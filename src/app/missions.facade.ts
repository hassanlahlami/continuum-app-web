import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Mission, MissionPage, MissionsService } from '../../libs/api-clients/missions';

/** Façade du module « missions » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class MissionsFacade {
  private readonly api = inject(MissionsService);

  list(): Observable<MissionPage> {
    return this.api.listMissions();
  }

  get(missionId: string): Observable<Mission> {
    return this.api.getMission(missionId);
  }
}
