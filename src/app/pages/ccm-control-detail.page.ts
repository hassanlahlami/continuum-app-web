import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CcmControl } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';
import { CCM_CATEGORY_LABELS, CCM_HEALTH_LABELS } from '../ccm.labels';

/**
 * Fiche d'un contrôle CCM (§5) : règle, référence normative, jeu de données, paramètres métier (définitions
 * + valeurs courantes), planification et état de santé. Lecture seule (D32) : le paramétrage (maker-checker,
 * {@code updateCcmControlSettings}) et l'exécution ({@code performCcmControlAction}) sont livrés plus tard
 * (ils dépendent de la table des exécutions {@code ccm_run}).
 */
@Component({
  selector: 'ct-ccm-control-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section>
      <a routerLink="/ccm/controls">← Bibliothèque de contrôles</a>
      @if (control(); as c) {
        <header>
          <h1 data-cy="ccm-control-label">{{ c.label }}</h1>
          <p>
            <code>{{ c.code }}</code> ·
            {{ categoryLabel(c.category) }} ·
            <span data-cy="ccm-control-active">{{ c.active ? 'Activé' : 'Désactivé' }}</span> ·
            <span class="badge" data-cy="ccm-control-health" [attr.data-health]="c.health">{{ healthLabel(c.health) }}</span>
          </p>
        </header>

        @if (c.description) {
          <p data-cy="ccm-control-description">{{ c.description }}</p>
        }

        <dl class="meta">
          @if (c.normativeReference) {
            <dt>Référence normative</dt><dd data-cy="ccm-control-normative">{{ c.normativeReference }}</dd>
          }
          @if (c.dataset) {
            <dt>Jeu de données</dt><dd data-cy="ccm-control-dataset">{{ c.dataset }}</dd>
          }
          @if (c.lastRunAt) {
            <dt>Dernière exécution</dt><dd>{{ c.lastRunAt }}</dd>
          }
          @if (c.nextRunAt) {
            <dt>Prochaine exécution</dt><dd>{{ c.nextRunAt }}</dd>
          }
          @if (c.exceptionRate != null) {
            <dt>Taux d'exceptions</dt><dd>{{ c.exceptionRate }}</dd>
          }
        </dl>

        @if (c.parameterDefinitions?.length) {
          <h2>Paramètres métier</h2>
          <table data-cy="ccm-control-parameters">
            <thead><tr><th>Paramètre</th><th>Type</th><th>Valeur</th></tr></thead>
            <tbody>
              @for (param of c.parameterDefinitions; track param.name) {
                <tr data-cy="ccm-param-row">
                  <td>{{ param.label || param.name }}</td>
                  <td>{{ param.type }}</td>
                  <td>{{ parameterValue(c, param.name) }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (c.settings?.schedule; as sch) {
          <p data-cy="ccm-control-schedule">
            Planification : {{ scheduleLabel(sch.mode) }}{{ sch.cron ? ' (' + sch.cron + ')' : '' }}
          </p>
        }
      } @else if (notFound()) {
        <p data-cy="ccm-control-notfound">Contrôle introuvable.</p>
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
})
export class CcmControlDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CcmFacade);
  readonly control = signal<CcmControl | null>(null);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('controlId') ?? '';
    if (id) {
      this.facade.getControl(id).subscribe({
        next: (c) => this.control.set(c),
        error: () => this.notFound.set(true),
      });
    }
  }

  /** Valeur courante d'un paramètre (settings) sinon sa valeur par défaut (définition). */
  parameterValue(c: CcmControl, name: string): string {
    const current = c.settings?.parameters?.[name];
    if (current !== undefined && current !== null) {
      return Array.isArray(current) ? current.join(', ') : String(current);
    }
    const def = c.parameterDefinitions?.find((p) => p.name === name)?.default;
    return def != null ? String(def) : '—';
  }

  categoryLabel(c: CcmControl.CategoryEnum): string {
    return CCM_CATEGORY_LABELS[c] ?? c;
  }

  healthLabel(h: CcmControl.HealthEnum): string {
    return CCM_HEALTH_LABELS[h] ?? h;
  }

  scheduleLabel(mode?: string): string {
    return mode === 'CRON' ? 'Planifiée' : mode === 'ON_EVENT' ? 'Sur événement' : '—';
  }
}
