import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule,ReactiveFormsModule], // Import FormsModule trực tiếp để sử dụng ngModel
})
export class ChatComponent implements OnInit, OnDestroy {
  isChatOpen = false;
  messages: { from: string, message: string }[] = [];
  newMessage = '';

  private socket: Socket;

  constructor() {
    // Khởi tạo Socket trực tiếp trong component
    this.socket = new Socket({
      url: 'http://localhost:3000',
      options: { transports: ['websocket'] },
    });
  }

  ngOnInit() {
    this.joinAsClient();
    this.receiveMessage().subscribe((data) => {
      this.messages.push(data);
    });
  }

  joinAsClient() {
    this.socket.emit('join', 'client');
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.socket.emit('sendMessage', {
        from: 'client',
        to: 'admin',
        message: this.newMessage,
      });
      this.messages.push({ from: 'client', message: this.newMessage });
      this.newMessage = '';
    }
  }

  receiveMessage(): Observable<{ from: string, message: string }> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (data: { from: string, message: string }) => {
        observer.next(data);
      });
    });
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
