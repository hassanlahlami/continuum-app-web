import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MissionType } from '../../../libs/api-clients/missions';
import { AuditableEntity } from '../../../libs/api-clients/planning';
import { MissionsFacade } from '../missions.facade';
import { PermissionsStore } from '../permissions.store';

/**
 * MIS-02 — Nouvelle mission (archétype ASSISTANT). Étapes : 1 type/périmètre, 2 entités auditées,
 * 3 dates et budget, 4 récapitulatif → `createMission`. L'étape « Équipe » (candidats) dépend d'une
 * mission existante (`listMissionTeamCandidates`) : elle se fait après création via MIS-05.
 * Les unités proposées viennent des portées de `mission.create` (aucune valeur en dur).
 */
@Component({
  selector: 'ct-mission-new',
  standalone: true,
  imports: [ReactiveFormsModule, MatStepperModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <section>
      <h1>Nouvelle mission</h1>
      <mat-stepper [linear]="true" data-cy="mission-wizard">
        <mat-step [stepControl]="step1" label="Type et périmètre">
          <form [formGroup]="step1">
            <mat-form-field appearance="outline">
              <mat-label>Type de mission</mat-label>
              <mat-select formControlName="missionTypeCode" data-cy="mw-type" (selectionChange)="onType($event.value)">
                @for (t of types(); track t.code) {
                  <mat-option [value]="t.code">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Titre</mat-label>
              <input matInput formControlName="title" data-cy="mw-title" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Unité porteuse</mat-label>
              <mat-select formControlName="unitId" data-cy="mw-unit">
                @for (u of units(); track u.id) {
                  <mat-option [value]="u.id">{{ u.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Périmètre</mat-label>
              <textarea matInput formControlName="scope" data-cy="mw-scope"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" matStepperNext type="button" data-cy="mw-next-1">Suivant</button>
          </form>
        </mat-step>
        <mat-step [stepControl]="step2" label="Entités auditées">
          <form [formGroup]="step2">
            @for (e of entities(); track e.id) {
              <div>
                <mat-checkbox [checked]="selected().has(e.id)" (change)="toggle(e.id, $event.checked)" data-cy="mw-entity">{{ e.label }}</mat-checkbox>
              </div>
            }
            <button mat-stroked-button matStepperPrevious type="button">Précédent</button>
            <button mat-flat-button color="primary" matStepperNext type="button" data-cy="mw-next-2">Suivant</button>
          </form>
        </mat-step>
        <mat-step [stepControl]="step3" label="Dates et budget">
          <form [formGroup]="step3">
            <mat-form-field appearance="outline">
              <mat-label>Début</mat-label>
              <input matInput type="date" formControlName="plannedStart" data-cy="mw-start" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fin</mat-label>
              <input matInput type="date" formControlName="plannedEnd" data-cy="mw-end" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Budget (jours)</mat-label>
              <input matInput type="number" min="0" formControlName="budgetDays" data-cy="mw-budget" />
            </mat-form-field>
            @if (step3.errors?.['range']) {
              <p role="alert" data-cy="mw-range-error">La fin doit suivre le début.</p>
            }
            <button mat-stroked-button matStepperPrevious type="button">Précédent</button>
            <button mat-flat-button color="primary" matStepperNext type="button" data-cy="mw-next-3">Suivant</button>
          </form>
        </mat-step>
        <mat-step label="Récapitulatif">
          <dl data-cy="mw-recap">
            <dt>Titre</dt>
            <dd>{{ step1.value.title }}</dd>
            <dt>Type</dt>
            <dd>{{ step1.value.missionTypeCode }}</dd>
            <dt>Entités</dt>
            <dd>{{ selected().size }}</dd>
            <dt>Période</dt>
            <dd>{{ step3.value.plannedStart }} → {{ step3.value.plannedEnd }}</dd>
          </dl>
          @if (error()) {
            <p role="alert" data-cy="mw-error">{{ error() }}</p>
          }
          <button mat-stroked-button matStepperPrevious type="button">Précédent</button>
          <button mat-flat-button color="primary" type="button" (click)="submit()" [disabled]="busy()" data-cy="mw-submit">Créer la mission</button>
        </mat-step>
      </mat-stepper>
    </section>
  `,
  styles: [
    `
      section { padding: var(--ct-space-4); }
      mat-form-field { display: block; max-width: 32rem; }
    `,
  ],
})
export class MissionNewPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(MissionsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly perms = inject(PermissionsStore);

  readonly types = signal<MissionType[]>([]);
  readonly entities = signal<AuditableEntity[]>([]);
  readonly selected = signal<Set<string>>(new Set());
  readonly units = signal<{ id: string; label: string }[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly step1 = this.fb.nonNullable.group({
    missionTypeCode: ['', Validators.required],
    title: ['', Validators.required],
    unitId: ['', Validators.required],
    scope: [''],
  });
  readonly step2 = this.fb.nonNullable.group({ count: [0, Validators.min(1)] });
  readonly step3 = this.fb.nonNullable.group(
    {
      plannedStart: ['', Validators.required],
      plannedEnd: ['', Validators.required],
      budgetDays: [null as number | null, Validators.min(0)],
    },
    { validators: (g) => (g.value['plannedStart'] && g.value['plannedEnd'] && g.value['plannedEnd'] < g.value['plannedStart'] ? { range: true } : null) },
  );

  ngOnInit(): void {
    this.perms.ensureLoaded().subscribe(() => {
      const f = this.perms.permissions()?.features.find((x) => x.code === 'mission.create');
      const scopes = (f?.scopes ?? []).filter((s) => !!s.id).map((s) => ({ id: s.id as string, label: s.label ?? (s.id as string) }));
      this.units.set(scopes);
      if (scopes.length === 1) this.step1.patchValue({ unitId: scopes[0].id });
    });
    this.facade.types().subscribe((t) => this.types.set(t));
    this.facade.entities().subscribe((e) => this.entities.set(e));
  }

  /** Pré-calcule la fin à partir de la durée par défaut du type (donnée du pack, pas une constante). */
  onType(code: string): void {
    const t = this.types().find((x) => x.code === code);
    const start = this.step3.value.plannedStart;
    if (t?.defaultDurationDays && start && !this.step3.value.plannedEnd) {
      const d = new Date(start);
      d.setDate(d.getDate() + t.defaultDurationDays);
      this.step3.patchValue({ plannedEnd: d.toISOString().slice(0, 10) });
    }
  }

  toggle(id: string, on: boolean): void {
    const s = new Set(this.selected());
    if (on) s.add(id);
    else s.delete(id);
    this.selected.set(s);
    this.step2.patchValue({ count: s.size });
  }

  submit(): void {
    const v1 = this.step1.getRawValue();
    const v3 = this.step3.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.facade
      .create({
        title: v1.title,
        missionTypeCode: v1.missionTypeCode,
        unitId: v1.unitId,
        scope: v1.scope || undefined,
        auditPlanItemId: this.route.snapshot.queryParamMap.get('planItemId') ?? undefined,
        auditedEntityIds: [...this.selected()],
        plannedStart: v3.plannedStart,
        plannedEnd: v3.plannedEnd,
        budgetDays: v3.budgetDays ?? undefined,
      })
      .subscribe({
        next: (m) => this.router.navigate(['/missions', m.id]),
        error: () => {
          this.busy.set(false);
          this.error.set('Création impossible : vérifiez les informations saisies.');
        },
      });
  }
}
