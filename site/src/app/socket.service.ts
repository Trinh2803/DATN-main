import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private socket: Socket) {
    this.socket = new Socket({ url: 'http://localhost:3000', options: { transports: ['websocket'] } });
  }

  // Kết nối với vai trò 'client'
  joinAsClient() {
    this.socket.emit('join', 'client');
  }

  // Gửi tin nhắn đến admin
  sendMessage(message: string) {
    this.socket.emit('sendMessage', {
      from: 'client',
      to: 'admin',
      message
    });
  }

  // Nhận tin nhắn từ admin
  receiveMessage(): Observable<{ from: string, message: string }> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (data: { from: string, message: string }) => {
        observer.next(data);
      });
    });
  }

  // Ngắt kết nối
  disconnect() {
    this.socket.disconnect();
  }
}
