import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { LoginModalService } from '../core/services/login-modal.service';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent implements OnDestroy {
  readonly isOpen$: Observable<boolean>;


  isLoggingIn = false;
  isGoogleReady = false;

  private googleInitialized = false;
  private renderTimer?: number;
  private googleLoginButton?: ElementRef<HTMLDivElement>;


  

  @ViewChild('googleLoginButton')
  set googleButton(element: ElementRef<HTMLDivElement> | undefined) {
    this.clearRenderTimer();
    this.googleLoginButton = element;

    if (element && this.loginModalService.isOpen) {
      this.scheduleGoogleButtonRender();
    }
  }

  constructor(
    private readonly authService: AuthService,
    private readonly loginModalService: LoginModalService,
    private readonly ngZone: NgZone,
  ) {
     this.isOpen$ = this.loginModalService.isOpen$;
  }

  close(): void {
    this.isGoogleReady = false;
    this.clearRenderTimer();
    this.loginModalService.close();
  }

  ngOnDestroy(): void {
    this.clearRenderTimer();
  }

  private scheduleGoogleButtonRender(): void {
    this.clearRenderTimer();

    this.renderTimer = window.setTimeout(() => {
      this.renderGoogleButton();
    }, 0);
  }

  private renderGoogleButton(): void {
    this.renderTimer = undefined;

    if (!this.loginModalService.isOpen) return;

    const host = this.googleLoginButton?.nativeElement;
    const googleApi = window.google;
    const clientId = window.__env?.['googleClientId'];

    if (!host || !googleApi?.accounts?.id) {
      this.renderTimer = window.setTimeout(() => {
        this.renderGoogleButton();
      }, 150);

      return;
    }

    if (!clientId) {
      console.error('Google client ID is missing from env.js.');
      return;
    }

    if (!this.googleInitialized) {
      googleApi.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }: { credential: string }) => {
          void this.loginWithGoogle(credential);
        },
      });

      this.googleInitialized = true;
    }

    host.replaceChildren();

    googleApi.accounts.id.renderButton(host, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 260,
    });

    this.isGoogleReady = true;
  }

  private async loginWithGoogle(credential: string): Promise<void> {
    this.ngZone.run(() => {
      this.isLoggingIn = true;
    });

    try {
      await this.authService.loginWithGoogle(credential);
      this.close();
    } finally {
      this.ngZone.run(() => {
        this.isLoggingIn = false;
      });
    }
  }

  private clearRenderTimer(): void {
    if (this.renderTimer !== undefined) {
      window.clearTimeout(this.renderTimer);
      this.renderTimer = undefined;
    }
  }
}