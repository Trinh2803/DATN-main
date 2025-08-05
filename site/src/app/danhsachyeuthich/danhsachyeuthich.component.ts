import { Component } from '@angular/core';

@Component({
  selector: 'app-danhsachyeuthich',
  imports: [],
  templateUrl: './danhsachyeuthich.component.html',
  styleUrl: './danhsachyeuthich.component.css'
})
export class DanhsachyeuthichComponent {
  favoriteItems: string[] = [];
  newItem: string = '';

  addItem() {
    const item = this.newItem.trim();
    if (item && !this.favoriteItems.includes(item)) {
      this.favoriteItems.push(item);
      this.newItem = '';
    }
  }

  removeItem(index: number) {
    this.favoriteItems.splice(index, 1);
  }
}
