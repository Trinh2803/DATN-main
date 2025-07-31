import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlygiamgiaComponent } from './quanlygiamgia.component';

describe('QuanlygiamgiaComponent', () => {
  let component: QuanlygiamgiaComponent;
  let fixture: ComponentFixture<QuanlygiamgiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuanlygiamgiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlygiamgiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
