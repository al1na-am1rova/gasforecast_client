import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitsPassports } from './units-passports';

describe('UnitsPassports', () => {
  let component: UnitsPassports;
  let fixture: ComponentFixture<UnitsPassports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitsPassports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitsPassports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
