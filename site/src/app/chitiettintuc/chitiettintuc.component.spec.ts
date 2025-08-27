/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ChitiettintucComponent } from './chitiettintuc.component';

describe('ChitiettintucComponent', () => {
  let component: ChitiettintucComponent;
  let fixture: ComponentFixture<ChitiettintucComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChitiettintucComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChitiettintucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
