import { ChangeDetectorRef, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked'; // Import marked parser
import { IdeiaImproved } from '../core/models/ideia-response.model';
import { AIService } from '../core/services/ai.service';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

@Component({
  selector: 'app-ideia-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ideia-view.component.html',
  styleUrls: ['./ideia-view.component.css']
})
export class IdeiaViewComponent {
  private readonly aiService = inject(AIService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() ideiaContent: IdeiaImproved = { originalIdeia: '', title: '', content: '', conversationId: '' };
  @Output() closeView = new EventEmitter<void>();

  isMarkdownMode: boolean = true;
  userMessage: string = '';
  isSending: boolean = false;
  chatMessages: ChatMessage[] = [];
  conversationId: string = '';

  toggleMode() {
    this.isMarkdownMode = !this.isMarkdownMode;
  }

  onBack() {
    this.closeView.emit();
  }

  async sendMessage() {
    const message = this.userMessage.trim();

    if (!message || this.isSending) {
      return;
    }

    const activeConversationId = this.conversationId || this.ideiaContent.conversationId || '';

    if (!activeConversationId) {
      return;
    }

    this.chatMessages = [...this.chatMessages, { role: 'user', content: message }];
    this.userMessage = '';
    this.isSending = true;
    this.cdr.detectChanges();

    try {
      this.conversationId = activeConversationId;

      const response = await this.aiService.continueConversation(activeConversationId, message);

      this.chatMessages = [...this.chatMessages, { role: 'assistant', content: response.content || '' }];
      if (!this.conversationId && response.conversationId) {
        this.conversationId = response.conversationId;
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    } finally {
      this.isSending = false;
      this.cdr.detectChanges();
    }
  }

  // Parses raw markdown string into safe HTML using marked
  get renderedMarkdown(): string {
    return marked.parse(this.ideiaContent.content) as string;
  }

  renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }
}