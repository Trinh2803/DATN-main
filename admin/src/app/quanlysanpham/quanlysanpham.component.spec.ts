import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuanlysanphamComponent } from './quanlysanpham.component';

describe('QuanlysanphamComponent', () => {
  let component: QuanlysanphamComponent;
  let fixture: ComponentFixture<QuanlysanphamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuanlysanphamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuanlysanphamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
