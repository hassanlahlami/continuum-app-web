import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, TaskPage, TasksService } from '../../libs/api-clients/me';

export type TaskObjectType = 'MISSION' | 'FINDING' | 'RECOMMENDATION' | 'AUDIT_PLAN' | 'CCM_EXCEPTION' | 'REPORT' | 'DOCUMENT_REQUEST';

/** Façade « Mes tâches » (COM-09) : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly api = inject(TasksService);

  list(opts: { status?: 'OPEN' | 'CLAIMED' | 'DONE'; objectType?: TaskObjectType; overdueOnly?: boolean } = {}): Observable<TaskPage> {
    return this.api.listMyTasks(undefined, undefined, undefined, opts.status, opts.objectType, opts.overdueOnly || undefined);
  }

  /** Prend une tâche proposée à plusieurs candidats (409 si un collègue l'a prise entre-temps). */
  claim(taskId: string): Observable<Task> {
    return this.api.claimTask(taskId);
  }

  /** Termine la tâche ; le serveur vérifie la fonctionnalité, la SoD et les gardes (§6.2.4). */
  complete(taskId: string): Observable<unknown> {
    return this.api.completeTask(taskId, { version: 0 });
  }
}
