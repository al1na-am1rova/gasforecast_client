import { ComponentFixture, TestBed } from '@angular/core/testing';

import {Stations} from './stations';

describe('StationsUnits', () => {
  let component: Stations;
  let fixture: ComponentFixture<Stations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
