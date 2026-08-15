import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeiaComponent } from '../ideia/ideia.component';
import { IdeaSort, IdeiaListComponent } from '../ideia-list/ideia-list.component';
import { IdeiaViewComponent } from '../ideia-view/ideia-view.component';
import { IdeiaImproved, PersistedConversation } from '../core/models/ideia-response.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { ConfirmDeleteModalComponent } from '../confirm-delete-modal/confirm-delete-modal.component';
import { AIService } from '../core/services/ai.service';
import { AuthService, GoogleUser } from '../core/services/auth.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, LoginModalComponent, ConfirmDeleteModalComponent, IdeiaComponent, IdeiaListComponent, IdeiaViewComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  private static readonly ideasPageSize = 3;

  readonly ideias = signal<IdeiaImproved[]>([]);
  readonly hasMoreIdeas = signal(false);
  readonly isLoadingIdeas = signal(false);
  readonly ideaSort = signal<IdeaSort>('updated_at');
  readonly ideiaToDelete = signal<IdeiaImproved | null>(null);
  readonly isDeletingIdea = signal(false);
  selectedIdeia: IdeiaImproved | null = null;
  readonly aiService = inject(AIService);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      filter((user): user is GoogleUser => user !== null),
      take(1),
    ).subscribe(() => void this.loadConversations());
  }

  async loadMoreIdeas(): Promise<void> {
    if (this.isLoadingIdeas() || !this.hasMoreIdeas()) {
      return;
    }

    await this.loadConversations(this.ideias().length);
  }

  async changeIdeaSort(sortBy: IdeaSort): Promise<void> {
    if (sortBy === this.ideaSort() || this.isLoadingIdeas()) {
      return;
    }

    this.ideaSort.set(sortBy);
    await this.loadConversations();
  }

  requestDeleteIdea(ideia: IdeiaImproved): void {
    this.ideiaToDelete.set(ideia);
  }

  cancelDeleteIdea(): void {
    if (!this.isDeletingIdea()) {
      this.ideiaToDelete.set(null);
    }
  }

  async confirmDeleteIdea(): Promise<void> {
    const ideia = this.ideiaToDelete();
    if (!ideia?.conversationId || this.isDeletingIdea()) {
      return;
    }

    this.isDeletingIdea.set(true);
    try {
      await this.aiService.deleteConversation(ideia.conversationId);
      this.ideiaToDelete.set(null);

      if (this.selectedIdeia?.conversationId === ideia.conversationId) {
        this.closeView();
      }

      await this.loadConversations();
    } catch (error) {
      console.error('Failed to delete idea:', error);
    } finally {
      this.isDeletingIdea.set(false);
    }
  }

  private async loadConversations(offset = 0): Promise<void> {
    this.isLoadingIdeas.set(true);
    console.log('AppComponent initialized. Loading saved ideas...');
    try {
      const response = await this.aiService.getConversations(
        offset,
        AppComponent.ideasPageSize,
        this.ideaSort(),
      );
      const convertedIdeias: IdeiaImproved[] = response.conversations.map((conversation) => this.toIdeia(conversation));
      this.ideias.update((currentIdeias) => offset === 0 ? convertedIdeias : [...currentIdeias, ...convertedIdeias]);
      this.hasMoreIdeas.set(response.has_more);
    } catch (error) {
      console.error('Failed to load saved ideas:', error);
    } finally {
      this.isLoadingIdeas.set(false);
    }
  }

    onAddIdeia(ideia: IdeiaImproved) {
      const ideiaWithCreatedAt = {
        ...ideia,
        createdAt: ideia.createdAt ?? new Date().toISOString(),
      };

      console.log('Adding new idea:', ideiaWithCreatedAt, this.ideias());
      this.ideias.update((currentIdeias) => [ideiaWithCreatedAt, ...currentIdeias,]);
      this.viewIdeia(ideiaWithCreatedAt);
    }


  viewIdeia(ideia: IdeiaImproved | null) {
    if (ideia) {
      this.selectedIdeia = ideia;
    }
  }

  closeView() {
    this.selectedIdeia = null;
  }

  private toIdeia(conversation: PersistedConversation): IdeiaImproved {
    const firstUserMessage = conversation.messages.find(
      (message) => message.role === 'user',
    );
    const firstAssistantMessage = conversation.messages.find(
      (message) => message.role === 'assistant',
    );
    const response = firstAssistantMessage?.response;

    return {
      originalIdeia: firstUserMessage?.content ?? '',
      title: response?.title ?? 'Untitled idea',
      content: response?.content ?? firstAssistantMessage?.content ?? '',
      tags: conversation.tags ?? [],
      conversationId: conversation.id,
      createdAt: conversation.created_at,
    };
  }
}
