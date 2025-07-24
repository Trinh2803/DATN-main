/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TintucComponent } from './tintuc.component';

describe('TintucComponent', () => {
  let component: TintucComponent;
  let fixture: ComponentFixture<TintucComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TintucComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TintucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
