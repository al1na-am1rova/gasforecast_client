import { TestBed } from '@angular/core/testing';

import { GasConsumptionService } from './gas-consumption.service';

describe('Data', () => {
  let service: GasConsumptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GasConsumptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
