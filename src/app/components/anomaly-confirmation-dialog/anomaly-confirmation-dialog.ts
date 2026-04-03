// anomaly-confirmation-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AnomalyCheckResponse } from '../../services/forecast.service/forecast';

@Component({
  selector: 'app-anomaly-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anomaly-confirmation-dialog.html',
  styleUrls: ['anomaly-confirmation-dialog.css']
})
export class AnomalyConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<AnomalyConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AnomalyCheckResponse
  ) {}
  
  onConfirm(): void {
    this.dialogRef.close(true);
  }
  
  onCancel(): void {
    this.dialogRef.close(false);
  }
}