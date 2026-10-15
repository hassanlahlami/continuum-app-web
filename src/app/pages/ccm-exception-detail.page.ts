import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AvailableAction, CcmException } from '../../../libs/api-clients/ccm';
import { CcmFacade } from '../ccm.facade';

/**
 * Détail d'une exception CCM (§5.3, D34) : résumé, contrôle, criticité, enregistrement source du CBS, et
 * les <strong>actions de triage</strong> décidées par le serveur ({@code availableActions} — retenir /
 * écarter / affecter / rouvrir). Écarter exige une justification. Une exception <em>retenue</em> peut être
 * convertie en constat candidat (§5.3). Le front n'invente aucune règle (D32). Composants Material (--ct-*).
 */
@Component({
  selector: 'ct-ccm-exception-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DatePipe,
  ],
  template: `
    <section>
      <a mat-button routerLink="/ccm"><mat-icon>arrow_back</mat-icon> Flux d'exceptions</a>
      @if (exc(); as e) {
        <mat-card appearance="outlined" class="block">
          <mat-card-header>
            <mat-card-title data-cy="ccm-exc-summary">{{ e.summary || e.controlCode }}</mat-card-title>
            <mat-card-subtitle>
              <code>{{ e.controlCode }}</code>
              @if (e.criticality; as c) { · Criticité : {{ c.label }} }
              @if (e.unit; as u) { · Unité : {{ u.label }} }
              · Détectée le {{ e.detectedAt | date: 'medium' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip disableRipple data-cy="ccm-exc-status">{{ e.status.label }}</mat-chip>
            </mat-chip-set>

            @if (e.sourceRecord) {
              <dl class="source" data-cy="ccm-source-record">
                @for (entry of sourceEntries(e); track entry.key) {
                  <dt>{{ entry.key }}</dt><dd>{{ entry.value }}</dd>
                }
              </dl>
            }
            @if (e.dismissalJustification) {
              <p data-cy="ccm-exc-justification">Motif d'écart : {{ e.dismissalJustification }}</p>
            }
            @if (e.findingId) {
              <p data-cy="ccm-exc-finding">Converti en constat : <code>{{ e.findingId }}</code></p>
            }
            @if (error(); as msg) {
              <p class="error" role="alert" data-cy="ccm-action-error">{{ msg }}</p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined" class="block">
          <mat-card-header><mat-card-title>Triage</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Justification (écart)</mat-label>
              <textarea matInput #justif data-cy="ccm-justification" rows="2"></textarea>
            </mat-form-field>
          </mat-card-content>
          @if (e.availableActions?.length) {
            <mat-card-actions align="end" data-cy="ccm-actions">
              @for (action of e.availableActions; track action.code) {
                @if (action.style === 'primary') {
                  <button mat-flat-button color="primary" [attr.data-cy]="'ccm-action-' + action.code"
                          [disabled]="busy()" (click)="run(e, action, justif.value)">{{ action.label }}</button>
                } @else {
                  <button mat-stroked-button [attr.data-cy]="'ccm-action-' + action.code"
                          [disabled]="busy()" (click)="run(e, action, justif.value)">{{ action.label }}</button>
                }
              }
            </mat-card-actions>
          }
        </mat-card>

        @if (e.status.code === 'RETAINED') {
          <mat-card appearance="outlined" class="block" data-cy="ccm-convert-box">
            <mat-card-header><mat-card-title>Convertir en constat</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Mission d'accueil</mat-label>
                <input matInput #mission data-cy="ccm-convert-mission" [value]="defaultMissionId" />
              </mat-form-field>
              @if (convertedRoute(); as r) {
                <p data-cy="ccm-converted">Constat créé : <a [routerLink]="[r]">voir</a></p>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-flat-button color="primary" type="button" data-cy="ccm-convert"
                      [disabled]="busy()" (click)="convert(e, mission.value)">Convertir en constat</button>
            </mat-card-actions>
          </mat-card>
        }
      } @else {
        <p>Chargement…</p>
      }
    </section>
  `,
  styles: [
    `
      .block { margin-top: var(--ct-space-4); }
      .full { width: 100%; max-width: 420px; }
      code { font-family: var(--ct-font-mono); }
      .source { display: grid; grid-template-columns: max-content 1fr; gap: var(--ct-space-1) var(--ct-space-4); margin: var(--ct-space-3) 0 0; }
      .source dt { color: var(--ct-color-muted); } .source dd { margin: 0; }
      .error { color: var(--ct-red-700); }
    `,
  ],
})
export class CcmExceptionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CcmFacade);
  readonly exc = signal<CcmException | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly convertedRoute = signal<string | null>(null);
  /** Mission de surveillance continue de démonstration (§5.5) — pré-remplie pour faciliter le triage. */
  readonly defaultMissionId = 'f1111111-1111-1111-1111-111111111101';
  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('exceptionId') ?? '';
    if (this.id) {
      this.facade.getException(this.id).subscribe((e) => this.exc.set(e));
    }
  }

  sourceEntries(e: CcmException): { key: string; value: string }[] {
    return e.sourceRecord
      ? Object.entries(e.sourceRecord).map(([key, value]) => ({ key, value: String(value) }))
      : [];
  }

  /** Exécute une action de triage décidée par le serveur ; écarter envoie la justification saisie. */
  run(exc: CcmException, action: AvailableAction, justification: string): void {
    this.busy.set(true);
    this.error.set(null);
    const comment = action.code === 'dismiss' ? justification : undefined;
    this.facade.performAction(exc.id, action.code, comment).subscribe({
      next: (updated) => {
        this.exc.set(updated);
        this.busy.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.messageFor(err));
        this.busy.set(false);
      },
    });
  }

  convert(exc: CcmException, missionId: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.facade.convert(exc.id, missionId).subscribe({
      next: (result) => {
        this.convertedRoute.set(result.route ?? '/missions');
        this.facade.getException(exc.id).subscribe((e) => this.exc.set(e));
        this.busy.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.messageFor(err));
        this.busy.set(false);
      },
    });
  }

  private messageFor(err: HttpErrorResponse): string {
    switch (err.status) {
      case 403:
        return 'Action non autorisée sur cette exception.';
      case 409:
        return err.error?.detail ?? 'Action en conflit (état incompatible ou déjà traitée).';
      case 422:
        return err.error?.detail ?? 'Justification requise pour écarter.';
      case 404:
        return 'Exception introuvable.';
      default:
        return "Échec de l'action. Réessayez.";
    }
  }
}
