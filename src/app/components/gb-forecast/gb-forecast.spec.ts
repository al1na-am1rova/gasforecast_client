import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GbForecast } from './gb-forecast';

describe('GbForecast', () => {
  let component: GbForecast;
  let fixture: ComponentFixture<GbForecast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GbForecast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GbForecast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
