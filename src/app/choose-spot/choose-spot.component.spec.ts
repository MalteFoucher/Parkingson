import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseSpotComponent } from './choose-spot.component';

describe('ChooseSpotComponent', () => {
  let component: ChooseSpotComponent;
  let fixture: ComponentFixture<ChooseSpotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseSpotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseSpotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
