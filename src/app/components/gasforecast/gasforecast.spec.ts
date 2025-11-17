import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gasforecast } from './gasforecast';

describe('Gasforecast', () => {
  let component: Gasforecast;
  let fixture: ComponentFixture<Gasforecast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gasforecast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gasforecast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
