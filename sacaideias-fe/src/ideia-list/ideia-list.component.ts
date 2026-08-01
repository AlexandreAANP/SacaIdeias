import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ideia-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ideia-list.component.html',
  styleUrls: ['./ideia-list.component.css']
})
export class IdeiaListComponent {
  @Input() ideias: string[] = [];
  @Output() ideaSelected = new EventEmitter<string>();

  selectIdea(ideia: string) {
    this.ideaSelected.emit(ideia);
  }
}