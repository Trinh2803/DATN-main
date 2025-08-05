import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhsachyeuthichComponent } from './danhsachyeuthich.component';

describe('DanhsachyeuthichComponent', () => {
  let component: DanhsachyeuthichComponent;
  let fixture: ComponentFixture<DanhsachyeuthichComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DanhsachyeuthichComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhsachyeuthichComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
