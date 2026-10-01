import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FindingPage, FindingsService } from '../../libs/api-clients/findings';

/** Façade du module « constats » : consomme le client généré (D32). */
@Injectable({ providedIn: 'root' })
export class FindingsFacade {
  private readonly api = inject(FindingsService);

  search(): Observable<FindingPage> {
    return this.api.searchFindings();
  }
}
