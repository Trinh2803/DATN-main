import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChitietdonhangComponent } from './chitietdonhang.component';

describe('ChitietdonhangComponent', () => {
  let component: ChitietdonhangComponent;
  let fixture: ComponentFixture<ChitietdonhangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChitietdonhangComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChitietdonhangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
