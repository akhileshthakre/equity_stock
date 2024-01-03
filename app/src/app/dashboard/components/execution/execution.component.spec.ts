import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionComponent } from './execution.component';

describe('ExecutionComponent', () => {
  let component: ExecutionComponent;
  let fixture: ComponentFixture<ExecutionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExecutionComponent]
    });
    fixture = TestBed.createComponent(ExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
