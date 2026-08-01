import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeiaComponent } from '../ideia/ideia.component';
import { IdeiaListComponent } from '../ideia-list/ideia-list.component';
import { IdeiaViewComponent } from '../ideia-view/ideia-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IdeiaComponent, IdeiaListComponent, IdeiaViewComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  ideias: string[] = [];
  selectedIdeia: string | null = null;

  addIdeia(novaIdeia: string) {
    this.ideias.push(novaIdeia);
  }

  viewIdeia(ideia: string) {
    this.selectedIdeia = ideia;
  }

  closeView() {
    this.selectedIdeia = null;
  }
}