import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyModelComponent } from './privacy-model.component';

describe('PrivacyModelComponent', () => {
  let component: PrivacyModelComponent;
  let fixture: ComponentFixture<PrivacyModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivacyModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
