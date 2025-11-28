import { TestBed } from '@angular/core/testing';

import { ConsumptionCalculateService } from './consumption-calculate.service';

describe('ConsumptionCalculateService', () => {
  let service: ConsumptionCalculateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsumptionCalculateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
