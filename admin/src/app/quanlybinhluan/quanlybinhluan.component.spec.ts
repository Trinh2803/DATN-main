import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuanlybinhluanComponent } from './quanlybinhluan.component';

describe('QuanlybinhluanComponent', () => {
  let component: QuanlybinhluanComponent;
  let fixture: ComponentFixture<QuanlybinhluanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuanlybinhluanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuanlybinhluanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 