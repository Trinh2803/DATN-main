import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@NgModule({
  // ...
  imports: [
    // ... các module khác
    FormsModule,
    CommonModule
  ],
  providers: [DatePipe],
  // ...
})
export class AppModule { } 