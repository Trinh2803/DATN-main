import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  imports: [
    FormsModule,
    CommonModule
  ],
  providers: [
    DatePipe,
    provideCharts(withDefaultRegisterables())
  ]
})
export class AppModule { }