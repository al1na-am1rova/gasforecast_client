import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomalyConfirmationDialog } from './anomaly-confirmation-dialog';

describe('AnomalyConfirmationDialog', () => {
  let component: AnomalyConfirmationDialog;
  let fixture: ComponentFixture<AnomalyConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnomalyConfirmationDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnomalyConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
