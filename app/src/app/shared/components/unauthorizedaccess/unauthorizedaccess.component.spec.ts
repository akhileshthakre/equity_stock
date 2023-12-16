import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnauthorizedaccessComponent } from './unauthorizedaccess.component';

describe('UnauthorizedaccessComponent', () => {
  let component: UnauthorizedaccessComponent;
  let fixture: ComponentFixture<UnauthorizedaccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UnauthorizedaccessComponent]
    });
    fixture = TestBed.createComponent(UnauthorizedaccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
