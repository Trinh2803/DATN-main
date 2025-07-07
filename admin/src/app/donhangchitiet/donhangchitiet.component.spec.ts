import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonhangchitietComponent } from './donhangchitiet.component';

describe('DonhangchitietComponent', () => {
  let component: DonhangchitietComponent;
  let fixture: ComponentFixture<DonhangchitietComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonhangchitietComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonhangchitietComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
