import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeiaImproved } from '../core/models/ideia-response.model';

@Component({
  selector: 'app-ideia-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ideia-list.component.html',
  styleUrls: ['./ideia-list.component.css']
})
export class IdeiaListComponent {
  @Input() ideias: IdeiaImproved[] = [];
  @Output() ideaSelected = new EventEmitter<IdeiaImproved>();

  selectIdea(ideia: IdeiaImproved) {
    this.ideaSelected.emit(ideia);
  }
}