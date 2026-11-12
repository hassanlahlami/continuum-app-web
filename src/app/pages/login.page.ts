import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginOptions, LoginResult } from '../../../libs/api-clients/auth';
import { AuthFacade, problemOf, safeReturnTo } from '../auth/auth.facade';

type Step = 'credentials' | 'mfa';

/**
 * COM-01 — Connexion (D41, contrat public/auth.yaml). Le mode (`rest` | `redirect`) vient de
 * `GET /options` : en `redirect` on navigue vers `/authorize` ; en `rest` on poste les identifiants au BFF
 * (cookie de session HttpOnly, CSRF double-submit). Identifiants faux et compte verrouillé ont le même
 * message (pas d'énumération) ; le mot de passe n'est jamais journalisé ni conservé après l'envoi.
 */
@Component({
  selector: 'ct-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="login" data-cy="login-page">
      <h1>Connexion</h1>
      @if (error(); as e) {
        <p class="err" role="alert" data-cy="login-error">{{ e }}</p>
      }
      @if (options(); as o) {
        @if (o.mode === 'rest') {
          @if (step() === 'credentials') {
            <form [formGroup]="form" (ngSubmit)="submit()" data-cy="login-form">
              <mat-form-field appearance="outline">
                <mat-label>Identifiant</mat-label>
                <input matInput formControlName="username" autocomplete="username" data-cy="login-username" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Mot de passe</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password" data-cy="login-password" />
              </mat-form-field>
              <button mat-flat-button type="submit" [disabled]="form.invalid || busy()" data-cy="login-submit">Se connecter</button>
            </form>
          } @else {
            <form [formGroup]="mfaForm" (ngSubmit)="submitMfa()" data-cy="mfa-form">
              <p>Saisissez le code à usage unique de votre application d'authentification.</p>
              <mat-form-field appearance="outline">
                <mat-label>Code</mat-label>
                <input matInput formControlName="code" inputmode="numeric" autocomplete="one-time-code" data-cy="mfa-code" />
              </mat-form-field>
              <button mat-flat-button type="submit" [disabled]="mfaForm.invalid || busy()" data-cy="mfa-submit">Valider</button>
            </form>
          }
        } @else {
          <button mat-flat-button type="button" (click)="redirect()" data-cy="login-redirect">Se connecter</button>
        }
        @if (step() === 'credentials') {
          <a class="link" [href]="forgotUrl" data-cy="login-forgot-password">Mot de passe oublié ?</a>
          @for (p of o.ssoProviders; track p.alias) {
            <button mat-stroked-button type="button" (click)="redirect(p.alias)" [attr.data-cy]="'login-sso-' + p.alias">
              {{ p.label.fr }}
            </button>
          }
        }
      }
    </section>
  `,
  styles: [
    `
      .login { display: flex; flex-direction: column; gap: var(--ct-space-3); max-width: 24rem; margin: var(--ct-space-6) auto; padding: var(--ct-space-4); background: var(--ct-color-surface); border: 1px solid var(--ct-color-border); border-radius: var(--ct-radius-md); }
      .link { color: var(--ct-color-primary); font-size: 0.85rem; }
      form { display: flex; flex-direction: column; gap: var(--ct-space-2); }
      .err { background: var(--ct-red-50); color: var(--ct-red-700); border: 1px solid var(--ct-red-100); border-radius: var(--ct-radius-sm); padding: var(--ct-space-2) var(--ct-space-3); margin: 0; }
    `,
  ],
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly forgotUrl = inject(AuthFacade).forgotPasswordUrl();
  readonly options = signal<LoginOptions | undefined>(undefined);
  readonly step = signal<Step>('credentials');
  readonly error = signal<string | undefined>(undefined);
  readonly busy = signal(false);
  private challengeId = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  readonly mfaForm = this.fb.nonNullable.group({ code: ['', [Validators.required, Validators.pattern(/^\d{6,8}$/)]] });

  private get returnTo(): string {
    return safeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'));
  }

  ngOnInit(): void {
    // GET /session pose le cookie XSRF-TOKEN ; si déjà connecté, on repart vers la destination.
    this.auth.refresh().subscribe({
      next: (s) => {
        if (s.authenticated) void this.router.navigateByUrl(this.returnTo);
      },
      error: () => this.error.set('Service indisponible. Réessayez.'),
    });
    this.auth.options().subscribe({
      next: (o) => this.options.set(o),
      error: () => this.error.set('Service indisponible. Réessayez.'),
    });
  }

  submit(): void {
    if (this.form.invalid || this.busy()) return;
    const { username, password } = this.form.getRawValue();
    this.run(this.auth.signIn(username, password));
    this.form.controls.password.reset('');
  }

  submitMfa(): void {
    if (this.mfaForm.invalid || this.busy()) return;
    this.run(this.auth.verifyMfa(this.challengeId, this.mfaForm.getRawValue().code));
  }

  redirect(idp?: string): void {
    window.location.assign(this.auth.redirectLoginUrl(this.returnTo, idp));
  }

  private run(call: ReturnType<AuthFacade['signIn']>): void {
    this.busy.set(true);
    this.error.set(undefined);
    call.subscribe({
      next: (r) => {
        this.busy.set(false);
        this.onResult(r);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private onResult(r: LoginResult): void {
    switch (r.status) {
      case 'AUTHENTICATED':
        void this.router.navigateByUrl(this.returnTo);
        break;
      case 'MFA_REQUIRED':
        this.challengeId = r.challengeId;
        this.step.set('mfa');
        break;
      case 'ACTION_REQUIRED':
        window.location.assign(r.redirectUrl);
        break;
    }
  }

  private messageFor(err: HttpErrorResponse): string {
    const p = problemOf(err);
    if (p?.reason === 'rate-limited') {
      const s = Number(err.headers?.get('Retry-After'));
      return s > 0 ? `Trop de tentatives. Réessayez dans ${s} s.` : 'Trop de tentatives. Réessayez plus tard.';
    }
    if (p?.reason === 'invalid-credentials') {
      return this.step() === 'mfa' ? 'Code invalide.' : 'Identifiant ou mot de passe incorrect.';
    }
    return 'Connexion impossible. Réessayez.';
  }
}
