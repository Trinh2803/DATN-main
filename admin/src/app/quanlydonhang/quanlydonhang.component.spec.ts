import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlydonhangComponent } from './quanlydonhang.component';

describe('QuanlydonhangComponent', () => {
  let component: QuanlydonhangComponent;
  let fixture: ComponentFixture<QuanlydonhangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuanlydonhangComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlydonhangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
