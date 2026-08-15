import { Component, ElementRef, inject, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../core/services/ai.service';
import { IdeiaImproved } from '../core/models/ideia-response.model';

@Component({
  selector: 'app-ideia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ideia.component.html',
  styleUrls: ['./ideia.component.css']
})
export class IdeiaComponent {
  private readonly aiService = inject(AIService);
  @ViewChild('ideiaTextarea') private ideiaTextarea?: ElementRef<HTMLTextAreaElement>;

  readonly detailSuggestions = [
    { label: 'Location', text: 'Location: [insert location]' },
    { label: 'Maximum budget', text: 'Maximum budget: [insert budget]' },
    { label: 'Target audience', text: 'Target audience: [insert audience]' },
    { label: 'Timeline', text: 'Timeline: [insert timeframe]' },
  ];

  ideiaText: string = '';
  
  readonly ideiaSubmitted = output<IdeiaImproved>();

  addDetail(detail: string): void {
    this.ideiaText = this.ideiaText.trim()
      ? `${this.ideiaText.trim()}\n${detail}`
      : detail;
    queueMicrotask(() => this.resizeTextarea());
  }

  resizeTextarea(textarea = this.ideiaTextarea?.nativeElement): void {
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  async onSubmit() {
    if (this.ideiaText.trim()) {
      const result = await this.aiService.getIdeiaSacada(this.ideiaText)
      console.log('Result from AIService:', result);
      const improvedIdeia: IdeiaImproved = {
        originalIdeia: this.ideiaText,
        title: result.title,
        content: result.content,
        tags: result.tags,
        conversationId: result.conversationId
      };
      this.ideiaSubmitted.emit(improvedIdeia);
      this.ideiaText = '';
      queueMicrotask(() => this.resizeTextarea());
    }
  }
}
