import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutWithHfComponent } from './layout-with-hf.component';

describe('LayoutWithHfComponent', () => {
  let component: LayoutWithHfComponent;
  let fixture: ComponentFixture<LayoutWithHfComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LayoutWithHfComponent]
    });
    fixture = TestBed.createComponent(LayoutWithHfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
