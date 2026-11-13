import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Mission, MissionCreate, MissionPage, MissionType, MissionsService } from '../../libs/api-clients/missions';
import { AuditableEntity, UniverseService } from '../../libs/api-clients/planning';

/** Façade du module « missions » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class MissionsFacade {
  private readonly api = inject(MissionsService);
  private readonly universe = inject(UniverseService);

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

  types(): Observable<MissionType[]> {
    return this.api.listActiveMissionTypes();
  }

  /** Entités auditables de l'univers (étape 2 de MIS-02). */
  entities(q?: string): Observable<AuditableEntity[]> {
    return this.universe.listAuditableEntities(0, 50, undefined, q || undefined).pipe(map((p) => p.items));
  }

  create(body: MissionCreate): Observable<Mission> {
    return this.api.createMission(body);
  }
}
