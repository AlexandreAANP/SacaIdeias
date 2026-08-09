import { Component, input, output } from '@angular/core';
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
  readonly ideias = input<IdeiaImproved[]>([]);
  readonly ideiaSelected = output<IdeiaImproved | null>();

  selectIdea(ideia: IdeiaImproved) {
    this.ideiaSelected.emit(ideia);
  }
}


