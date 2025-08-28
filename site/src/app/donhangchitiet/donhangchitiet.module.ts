import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DonhangchitietComponent } from './donhangchitiet.component';
import { ProductReviewComponent } from '../components/product-review/product-review.component';

@NgModule({
  declarations: [],  // Không declare standalone components
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: DonhangchitietComponent }  // Route config ở đây
    ]),
    DonhangchitietComponent,  // Import standalone component
    ProductReviewComponent   // Import nếu cần dùng trong module khác
  ],
  exports: [DonhangchitietComponent, ProductReviewComponent]
})
export class DonhangchitietModule { }