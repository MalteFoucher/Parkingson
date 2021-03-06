import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextInputDialogComponent } from './text-input-dialog.component';

describe('TextInputDialogComponent', () => {
  let component: TextInputDialogComponent;
  let fixture: ComponentFixture<TextInputDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextInputDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextInputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
