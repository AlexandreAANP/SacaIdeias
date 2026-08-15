import { Component, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IdeiaImproved } from '../core/models/ideia-response.model';

export type IdeaSort = 'updated_at' | 'created_at';

@Component({
  selector: 'app-ideia-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './ideia-list.component.html',
  styleUrls: ['./ideia-list.component.css']
})
export class IdeiaListComponent {
  readonly isExpanded = signal(false);
  readonly ideias = input<IdeiaImproved[]>([]);
  readonly hasMore = input(false);
  readonly isLoading = input(false);
  readonly sortBy = input<IdeaSort>('updated_at');
  readonly ideiaSelected = output<IdeiaImproved | null>();
  readonly loadMore = output<void>();
  readonly sortChanged = output<IdeaSort>();
  readonly deleteRequested = output<IdeiaImproved>();

  selectIdea(ideia: IdeiaImproved) {
    this.isExpanded.set(false);
    this.ideiaSelected.emit(ideia);
  }

  requestDelete(ideia: IdeiaImproved): void {
    this.deleteRequested.emit(ideia);
  }

  toggleList(): void {
    this.isExpanded.update((isExpanded) => !isExpanded);
  }

  loadMoreIdeas(): void {
    this.loadMore.emit();
  }

  changeSort(value: string): void {
    if (value === 'updated_at' || value === 'created_at') {
      this.sortChanged.emit(value);
    }
  }
}
