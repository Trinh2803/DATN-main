import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuanlybinhluanComponent } from './quanlybinhluan.component';
import { CommentService } from '../services/comment.service';
import { ProductService } from '../services/product.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('QuanlybinhluanComponent', () => {
  let component: QuanlybinhluanComponent;
  let fixture: ComponentFixture<QuanlybinhluanComponent>;
  let commentServiceMock: any;
  let productServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    commentServiceMock = {
      getComments: jasmine.createSpy('getComments').and.returnValue(of({
        success: true,
        data: [
          {
            _id: '1',
            userName: 'User 1',
            userEmail: 'user1@example.com',
            content: 'Great product',
            rating: 5,
            status: 'approved',
            createdAt: '2023-10-01',
            productId: { _id: 'prod1', name: 'Product 1', thumbnail: '/assets/images/product1.png' }
          },
          {
            _id: '2',
            userName: 'User 2',
            userEmail: 'user2@example.com',
            content: 'Homepage comment',
            rating: 4,
            status: 'pending',
            createdAt: '2023-10-02',
            productId: { _id: 'homepage', name: 'Trang chủ' }
          }
        ]
      })),
      getCommentStats: jasmine.createSpy('getCommentStats').and.returnValue(of({
        success: true,
        data: { total: 2, pending: 1, approved: 1, rejected: 0, stats: [] }
      }))
    };

    productServiceMock = {
      getProducts: jasmine.createSpy('getProducts').and.returnValue(of([
        { _id: 'prod1', name: 'Product 1' },
        { _id: 'prod2', name: 'Product 2' }
      ]))
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [QuanlybinhluanComponent],
      providers: [
        { provide: CommentService, useValue: commentServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuanlybinhluanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comments with valid productId', () => {
    expect(commentServiceMock.getComments).toHaveBeenCalled();
    expect(component.comments.length).toBe(2);
    expect(component.comments[0].productId?.name).toBe('Product 1');
    expect(component.comments[1].productId?.name).toBe('Trang chủ');
  });
});
