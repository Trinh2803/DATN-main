import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule], // Import FormsModule trực tiếp để sử dụng ngModel
})
export class ChatComponent implements OnInit, OnDestroy {
  isChatOpen = false;
  messages: { from: string, message: string }[] = [];
  newMessage = '';

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.joinAsAdmin();
    this.chatService.receiveMessage().subscribe((data) => {
      this.messages.push(data);
    });
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatService.replyMessage(this.newMessage);
      this.messages.push({ from: 'admin', message: this.newMessage });
      this.newMessage = '';
    }
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }
}
