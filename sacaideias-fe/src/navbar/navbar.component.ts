import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { AuthService, GoogleUser } from '../core/services/auth.service';
import { Router } from '@angular/router';
import { GoogleLoginButtonComponent } from '../google-login-button/google-login-button.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, GoogleLoginButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly currentUser$: Observable<GoogleUser | null> = this.authService.currentUser$;

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigateByUrl('/');
    window.location.reload();
  }

  
}
