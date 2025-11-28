import { ComponentFixture, TestBed } from '@angular/core/testing';

import {StationsUnits} from './stationsUnits';

describe('StationsUnits', () => {
  let component: StationsUnits;
  let fixture: ComponentFixture<StationsUnits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StationsUnits]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StationsUnits);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
