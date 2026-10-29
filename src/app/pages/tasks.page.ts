import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Task, TaskPage } from '../../../libs/api-clients/me';
import { TaskObjectType, TasksFacade } from '../tasks.facade';

/**
 * COM-09 — Mes tâches (archétype LISTE, `/tasks`). Boîte unifiée (`GET /tasks`) : filtres statut / type
 * d'objet / en retard reflétés dans l'URL. Les actions (`claim`, `complete`) viennent de
 * `availableActions` (serveur, §2.1.4) ; sans action de liste, on ouvre la page de traitement (`route`).
 */
@Component({
  selector: 'ct-tasks',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatTableModule, MatChipsModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <section>
      <h1>Mes tâches</h1>

      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Statut</mat-label>
              <mat-select [value]="filters().status" (selectionChange)="set({ status: $event.value })" data-cy="tasks-status">
                <mat-option value="OPEN">À traiter</mat-option>
                <mat-option value="DONE">Terminées</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="dense">
              <mat-label>Type d'objet</mat-label>
              <mat-select [value]="filters().objectType" (selectionChange)="set({ objectType: $event.value })" data-cy="tasks-type">
                <mat-option value="">Tous</mat-option>
                @for (t of objectTypes; track t.code) {
                  <mat-option [value]="t.code">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button type="button" [class.active]="filters().overdue" (click)="set({ overdue: filters().overdue ? '' : 'true' })" data-cy="tasks-overdue">
              <mat-icon>schedule</mat-icon> En retard
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (error()) {
        <p role="alert" data-cy="tasks-error">{{ error() }}</p>
      }

      @if (page(); as p) {
        <p class="muted" data-cy="tasks-count">{{ p.totalItems }} tâche(s)</p>
        @if (p.items.length) {
          <mat-card appearance="outlined" class="table-card">
            <table mat-table [dataSource]="p.items" data-cy="tasks-table">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Tâche</th>
                <td mat-cell *matCellDef="let t">{{ t.title }}</td>
              </ng-container>
              <ng-container matColumnDef="object">
                <th mat-header-cell *matHeaderCellDef>Objet</th>
                <td mat-cell *matCellDef="let t"><span class="muted">{{ t.objectLabel ?? label(t.objectType) }}</span></td>
              </ng-container>
              <ng-container matColumnDef="due">
                <th mat-header-cell *matHeaderCellDef>Échéance</th>
                <td mat-cell *matCellDef="let t">
                  @if (t.dueAt) { {{ t.dueAt | date: 'shortDate' }} } @else { — }
                  @if (t.overdue) { <span class="overdue" data-cy="task-overdue">En retard</span> }
                </td>
              </ng-container>
              <ng-container matColumnDef="assignment">
                <th mat-header-cell *matHeaderCellDef>Attribution</th>
                <td mat-cell *matCellDef="let t">
                  <span class="muted">{{ t.status === 'CLAIMED' ? 'Assignée à moi' : t.status === 'DONE' ? 'Terminée' : 'Proposée à ' + (t.candidateCount ?? 1) }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef><span class="sr-only">Actions</span></th>
                <td mat-cell *matCellDef="let t" class="row-actions">
                  @for (a of t.availableActions ?? []; track a.code) {
                    <button mat-flat-button [attr.data-cy]="'task-' + a.code" (click)="run(t, a.code)">{{ a.label }}</button>
                  }
                  <button mat-button (click)="open(t)" data-cy="task-open">Ouvrir</button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: columns" data-cy="task-row"></tr>
            </table>
          </mat-card>
        } @else {
          <p data-cy="tasks-empty">Aucune tâche pour ces critères.</p>
        }
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Chargement"></mat-progress-bar>
      }
    </section>
  `,
  styles: [
    `
      .filters { display: flex; flex-wrap: wrap; gap: var(--ct-space-3); align-items: center; }
      .filters .dense { width: 190px; }
      .filters button.active { background: var(--ct-color-primary-soft); }
      .table-card { margin-top: var(--ct-space-4); padding: 0; overflow: hidden; }
      table[mat-table] { width: 100%; background: transparent; }
      th.mat-mdc-header-cell { background: var(--ct-color-surface); }
      .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .row-actions { display: flex; gap: var(--ct-space-2); justify-content: flex-end; align-items: center; }
      .muted { color: var(--ct-color-muted); }
      .overdue { color: var(--ct-color-danger); margin-left: var(--ct-space-2); }
    `,
  ],
})
export class TasksPage implements OnInit {
  private readonly facade = inject(TasksFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<TaskPage | null>(null);
  readonly error = signal<string | null>(null);
  readonly filters = signal<{ status: 'OPEN' | 'DONE'; objectType: string; overdue: string }>({ status: 'OPEN', objectType: '', overdue: '' });
  readonly columns = ['title', 'object', 'due', 'assignment', 'actions'];
  readonly objectTypes: { code: TaskObjectType; label: string }[] = [
    { code: 'MISSION', label: 'Mission' },
    { code: 'FINDING', label: 'Constat' },
    { code: 'RECOMMENDATION', label: 'Recommandation' },
    { code: 'AUDIT_PLAN', label: "Plan d'audit" },
    { code: 'CCM_EXCEPTION', label: 'Exception CCM' },
    { code: 'REPORT', label: 'Rapport' },
    { code: 'DOCUMENT_REQUEST', label: 'Demande de documents' },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status') === 'DONE' ? 'DONE' : 'OPEN';
      const objectType = params.get('objectType') ?? '';
      const overdue = params.get('overdueOnly') === 'true' ? 'true' : '';
      this.filters.set({ status, objectType, overdue });
      this.load();
    });
  }

  private load(): void {
    const f = this.filters();
    this.page.set(null);
    this.facade
      .list({ status: f.status, objectType: (f.objectType as TaskObjectType) || undefined, overdueOnly: f.overdue === 'true' })
      .subscribe((p) => this.page.set(p));
  }

  set(change: Partial<{ status: string; objectType: string; overdue: string }>): void {
    const next = { ...this.filters(), ...change };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: next.status === 'OPEN' ? null : next.status,
        objectType: next.objectType || null,
        overdueOnly: next.overdue || null,
      },
    });
  }

  label(code: string): string {
    return this.objectTypes.find((t) => t.code === code)?.label ?? code;
  }

  /** Exécute une action de liste décidée par le serveur ; un 409 (prise simultanée) est signalé puis la liste rechargée. */
  run(t: Task, code: string): void {
    this.error.set(null);
    const call = code === 'claim' ? this.facade.claim(t.id) : this.facade.complete(t.id);
    call.subscribe({
      next: () => this.load(),
      error: (e) => {
        this.error.set(e?.status === 409 ? 'Cette tâche a été prise par un autre utilisateur.' : "L'action a échoué.");
        this.load();
      },
    });
  }

  open(t: Task): void {
    this.router.navigateByUrl(t.route);
  }
}
