import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginModalService {
  private readonly isOpenSubject = new BehaviorSubject<boolean>(false);

  readonly isOpen$ = this.isOpenSubject.asObservable();

  open(): void {
    console.log("open");
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}