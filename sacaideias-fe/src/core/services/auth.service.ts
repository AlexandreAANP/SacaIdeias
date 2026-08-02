import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { environment } from '../../enviroments/environment';

declare const google: any;

export interface GoogleLoginResponse {
  token: string;
  user: {
    email: string;
    name?: string;
    picture?: string;
    google_subject?: string;
    updated_at?: string;
  };
}

export type GoogleUser = GoogleLoginResponse['user'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly backendUri = 'http://localhost:8000';
  private readonly currentUserSubject = new BehaviorSubject<GoogleUser | null>(this.readUserFromCookie());
  private googleInitialized = false;

  readonly currentUser$ = this.currentUserSubject.asObservable();

  public async loginWithGoogle(credential: string): Promise<GoogleLoginResponse> {
    const response = await firstValueFrom(
      this.http.post<GoogleLoginResponse>(`${this.backendUri}/api/v1/auth/google`, {
        credential,
      })
    );

    this.setSession(response);

    return response;
  }

  public logout(): void {
    this.deleteCookie('sacaideias_token');
    this.deleteCookie('sacaideias_user');
    this.currentUserSubject.next(null);
  }

  public async startGoogleLogin(): Promise<void> {
    if (google === undefined || !google.accounts?.id) {
      throw new Error('Google sign-in is not ready yet');
    }

    const clientId = window.__env['googleClientId'] || environment.googleClientId;

    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      throw new Error('Google client id is not configured');
    }

    if (!this.googleInitialized) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          await this.loginWithGoogle(response.credential);
        },
      });

      this.googleInitialized = true;
    }

    google.accounts.id.prompt();
  }

  public getCurrentUser(): GoogleUser | null {
    return this.currentUserSubject.value;
  }

  private setSession(response: GoogleLoginResponse): void {
    this.setCookie('sacaideias_token', response.token, 7);
    this.setCookie('sacaideias_user', JSON.stringify(response.user), 7);
    this.currentUserSubject.next(response.user);
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}; expires=${expires}; path=/; SameSite=Lax`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  private readUserFromCookie(): GoogleUser | null {
    const cookieValue = this.getCookie('sacaideias_user');

    if (!cookieValue) {
      return null;
    }

    try {
      return JSON.parse(cookieValue) as GoogleUser;
    } catch {
      return null;
    }
  }

  private getCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith(prefix));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.slice(prefix.length));
  }
}