import { Pipe, PipeTransform } from '@angular/core';
     import { Category } from '../services/category.service';

     @Pipe({
       name: 'findCategory',
       standalone: true
     })
     export class FindCategoryPipe implements PipeTransform {
       transform(categories: Category[], categoryId: string): Category | undefined {
         return categories.find(category => category._id === categoryId);
       }
     }