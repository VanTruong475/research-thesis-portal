import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  @ViewChild('errorSummary') private errorSummary?: ElementRef<HTMLDivElement>;

  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loginForm = inject(NonNullableFormBuilder).group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected isSubmitting = false;
  protected apiErrorMessage = '';

  submit(): void {
    this.apiErrorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.focusErrorSummary();
      return;
    }

    this.isSubmitting = true;
    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          const returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: unknown) => {
          this.apiErrorMessage = this.extractErrorMessage(error);
          this.focusErrorSummary();
        },
      });
  }

  protected hasFieldError(fieldName: 'identifier' | 'password'): boolean {
    const field = this.loginForm.controls[fieldName];
    return field.invalid && (field.touched || field.dirty);
  }

  private safeReturnUrl(returnUrl: string | null): string {
    if (returnUrl?.startsWith('/app')) {
      return returnUrl;
    }

    return '/app/dashboard';
  }

  private focusErrorSummary(): void {
    window.setTimeout(() => this.errorSummary?.nativeElement.focus(), 0);
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseBody = (error as { error?: { message?: string } }).error;
      if (responseBody?.message) {
        return responseBody.message;
      }
    }

    return 'Unable to sign in. Please check your account information and try again.';
  }
}
