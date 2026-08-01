import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked'; // Import marked parser

@Component({
  selector: 'app-ideia-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ideia-view.component.html',
  styleUrls: ['./ideia-view.component.css']
})
export class IdeiaViewComponent {
  @Input() ideiaContent: string = '';
  @Output() closeView = new EventEmitter<void>();

  isMarkdownMode: boolean = true;

  toggleMode() {
    this.isMarkdownMode = !this.isMarkdownMode;
  }

  onBack() {
    this.closeView.emit();
  }

  // Parses raw markdown string into safe HTML using marked
  get renderedMarkdown(): string {
    return marked.parse(this.ideiaContent) as string;
  }
}