import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeiaComponent } from '../ideia/ideia.component';
import { IdeiaListComponent } from '../ideia-list/ideia-list.component';
import { IdeiaViewComponent } from '../ideia-view/ideia-view.component';
import { IdeiaImproved, PersistedConversation } from '../core/models/ideia-response.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AIService } from '../core/services/ai.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, LoginModalComponent, IdeiaComponent, IdeiaListComponent, IdeiaViewComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  readonly ideias = signal<IdeiaImproved[]>([]);
  selectedIdeia: IdeiaImproved | null = null;
  readonly aiService = inject(AIService);

    ngOnInit(): void {
      console.log('AppComponent initialized. Loading saved ideas...');
      this.aiService.getConversations().then((response) => {
          let convertedIdeias: IdeiaImproved[] = response.conversations.map((conversation) => this.toIdeia(conversation));
          this.ideias.set(convertedIdeias);
        }).catch((error) => {
          console.error('Failed to load saved ideas:', error);
        });
    }

    onAddIdeia(ideia: IdeiaImproved) {
      console.log('Adding new idea:', ideia, this.ideias());
      this.ideias.update((currentIdeias) => [...currentIdeias, ideia]);
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
      conversationId: conversation.id,
    };
  }
}