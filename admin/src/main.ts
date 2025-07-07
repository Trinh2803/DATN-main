import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Đường dẫn đến file routes

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Cung cấp routes
    provideHttpClient(), // Cung cấp HttpClient
  ],
}).catch((err) => console.error(err));