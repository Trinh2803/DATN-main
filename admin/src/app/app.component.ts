import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Thay RouterOutlet bằng RouterModule
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ChatComponent], // Import RouterModule
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'admin';
}
