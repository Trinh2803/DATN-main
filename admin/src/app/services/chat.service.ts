import { Injectable, ApplicationRef } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;

  constructor(private appRef: ApplicationRef) {
    const config: SocketIoConfig = {
      url: 'http://localhost:3000',
      options: { transports: ['websocket'] }
    };
    this.socket = new Socket(config, this.appRef);
  }

  // Kết nối với vai trò 'admin'
  joinAsAdmin() {
    this.socket.emit('join', 'admin');
  }

  // Nhận tin nhắn từ client
  receiveMessage(): Observable<{ from: string, message: string }> {
    return new Observable((observer) => {
      this.socket.on('receiveMessage', (data: { from: string, message: string }) => {
        observer.next(data);
      });
    });
  }

  // Gửi tin nhắn đến client
  replyMessage(message: string) {
    this.socket.emit('replyMessage', {
      from: 'admin',
      to: 'client',
      message
    });
  }

  // Ngắt kết nối
  disconnect() {
    this.socket.disconnect();
  }
}