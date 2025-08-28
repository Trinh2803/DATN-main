import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  // ...
  imports: [
    // ... các module khác
    FormsModule,
    CommonModule,
    NgChartsModule
  ],
  providers: [DatePipe],
  // ...
})
export class AppModule { }