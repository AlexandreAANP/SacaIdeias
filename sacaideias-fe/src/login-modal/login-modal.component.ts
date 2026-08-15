import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { LoginModalService } from '../core/services/login-modal.service';
import { Observable } from 'rxjs';
import { GoogleLoginButtonComponent } from '../google-login-button/google-login-button.component';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [AsyncPipe, GoogleLoginButtonComponent],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent {
  readonly isOpen$: Observable<boolean>;

  constructor(
    private readonly loginModalService: LoginModalService,
  ) {
     this.isOpen$ = this.loginModalService.isOpen$;
  }

  close(): void {
    this.loginModalService.close();
  }
}
