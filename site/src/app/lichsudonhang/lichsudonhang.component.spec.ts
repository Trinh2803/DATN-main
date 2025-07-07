import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LichsudonhangComponent } from './lichsudonhang.component';

describe('LichsudonhangComponent', () => {
  let component: LichsudonhangComponent;
  let fixture: ComponentFixture<LichsudonhangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LichsudonhangComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LichsudonhangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
