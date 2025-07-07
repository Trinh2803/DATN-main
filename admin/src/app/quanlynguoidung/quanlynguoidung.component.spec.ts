import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlynguoidungComponent } from './quanlynguoidung.component';

describe('QuanlynguoidungComponent', () => {
  let component: QuanlynguoidungComponent;
  let fixture: ComponentFixture<QuanlynguoidungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuanlynguoidungComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlynguoidungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
