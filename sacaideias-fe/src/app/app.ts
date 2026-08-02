import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdeiaComponent } from '../ideia/ideia.component';
import { IdeiaListComponent } from '../ideia-list/ideia-list.component';
import { IdeiaViewComponent } from '../ideia-view/ideia-view.component';
import { IdeiaImproved } from '../core/models/ideia-response.model';
import { NavbarComponent } from '../navbar/navbar.component';
import { LoginModalComponent } from '../login-modal/login-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, LoginModalComponent, IdeiaComponent, IdeiaListComponent, IdeiaViewComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  ideias: IdeiaImproved[] = [];
  selectedIdeia: IdeiaImproved | null = null;

  addIdeia(novaIdeia: IdeiaImproved) {
    this.ideias.push(novaIdeia);
  }

  viewIdeia(ideia: IdeiaImproved) {
    this.selectedIdeia = ideia;
  }

  closeView() {
    this.selectedIdeia = null;
  }
}