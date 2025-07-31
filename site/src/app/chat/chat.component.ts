import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
})
export class ChatComponent implements OnInit, OnDestroy {
  isChatOpen = false;
  messages: { from: string, message: string }[] = [];
  newMessage = '';

  constructor() {}

  ngOnInit() {
    // Simplified initialization
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({ from: 'client', message: this.newMessage });
      this.newMessage = '';
    }
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
