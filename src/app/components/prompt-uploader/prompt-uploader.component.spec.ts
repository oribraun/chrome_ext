import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptUploaderComponent } from './prompt-uploader.component';

describe('PromptUploaderComponent', () => {
  let component: PromptUploaderComponent;
  let fixture: ComponentFixture<PromptUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PromptUploaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PromptUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
