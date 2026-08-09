import { Component, EventEmitter, inject, output, Output } from '@angular/core';
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
  
  ideiaText: string = '';
  
  readonly ideiaSubmitted = output<IdeiaImproved>();

  async onSubmit() {
    if (this.ideiaText.trim()) {
      const result = await this.aiService.getIdeiaSacada(this.ideiaText)
      console.log('Result from AIService:', result);
      const improvedIdeia: IdeiaImproved = {
        originalIdeia: this.ideiaText,
        title: result.title,
        content: result.content,
        conversationId: result.conversationId
      };
      this.ideiaSubmitted.emit(improvedIdeia);
      this.ideiaText = '';
    }
  }
}