import { Component, ElementRef, EventEmitter, HostListener, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  templateUrl: './google-login-button.component.html',
  styleUrl: './google-login-button.component.css',
})
export class GoogleLoginButtonComponent implements OnDestroy {
  @Output() readonly loginCompleted = new EventEmitter<void>();

  isLoggingIn = false;
  isGoogleReady = false;

  private googleInitialized = false;
  private renderTimer?: number;
  private googleLoginButton?: ElementRef<HTMLDivElement>;

  @ViewChild('googleLoginButton')
  set googleButton(element: ElementRef<HTMLDivElement> | undefined) {
    this.clearRenderTimer();
    this.googleLoginButton = element;

    if (element) {
      this.scheduleGoogleButtonRender();
    }
  }

  constructor(
    private readonly authService: AuthService,
    private readonly ngZone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this.clearRenderTimer();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleGoogleButtonRender();
  }

  private scheduleGoogleButtonRender(): void {
    this.clearRenderTimer();

    this.renderTimer = window.setTimeout(() => {
      this.renderGoogleButton();
    }, 0);
  }

  private renderGoogleButton(): void {
    this.renderTimer = undefined;

    const host = this.googleLoginButton?.nativeElement;
    const googleApi = window.google;
    const clientId = window.__env?.['googleClientId'];

    if (!host || !googleApi?.accounts?.id || host.clientWidth === 0) {
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
        callback: ({ credential }: google.accounts.id.CredentialResponse) => {
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
      width: Math.min(260, Math.floor(host.clientWidth)),
    });

    this.isGoogleReady = true;
  }

  private async loginWithGoogle(credential: string): Promise<void> {
    this.ngZone.run(() => {
      this.isLoggingIn = true;
    });

    try {
      await this.authService.loginWithGoogle(credential);
      this.loginCompleted.emit();
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
