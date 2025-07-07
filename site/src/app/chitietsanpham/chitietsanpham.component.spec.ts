import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChiTietSanPhamComponent } from './chitietsanpham.component';

describe('ChitietsanphamComponent', () => {
  let component: ChiTietSanPhamComponent;
  let fixture: ComponentFixture<ChiTietSanPhamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietSanPhamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietSanPhamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
