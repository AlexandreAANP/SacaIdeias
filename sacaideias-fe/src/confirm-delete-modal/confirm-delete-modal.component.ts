import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.css',
})
export class ConfirmDeleteModalComponent {
  readonly ideaTitle = input('this idea');
  readonly isDeleting = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
