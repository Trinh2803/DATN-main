import { Pipe, PipeTransform } from '@angular/core';
import { Category } from '../services/category.service';
import { Discount } from '../services/discount.service';

@Pipe({
  name: 'findCategory',
  standalone: true
})
export class FindCategoryPipe implements PipeTransform {
  transform(categories: Category[], categoryId: string): Category | undefined {
    return categories?.find(category => category._id === categoryId);
  }
}

@Pipe({
  name: 'findDiscount',
  standalone: true
})
export class FindDiscountPipe implements PipeTransform {
  transform(discounts: Discount[], discountId: string): Discount | undefined {
    return discounts?.find(discount => discount._id === discountId);
  }
}