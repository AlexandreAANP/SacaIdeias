import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ideia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ideia.component.html',
  styleUrls: ['./ideia.component.css']
})
export class IdeiaComponent {
  ideiaText: string = '';
  
  @Output() ideiaSubmitted = new EventEmitter<string>();

  onSubmit() {
    if (this.ideiaText.trim()) {
      this.ideiaSubmitted.emit(this.ideiaText);
      this.ideiaText = '';
    }
  }
}