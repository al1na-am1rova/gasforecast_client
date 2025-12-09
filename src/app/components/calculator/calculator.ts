import { ConsumptionCalculateService, CalculationRequest, CalculationResponse} from '../../services/consumption-calculate.service/consumption-calculate.service';
import { Component, Input} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calculator',
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
  standalone: true
})
export class Calculator {
constructor(private _calculator: ConsumptionCalculateService){}
@Input() selectedStationId!: number;

calculationRequestData: CalculationRequest = {
  stationId: 0,
  outsideTemperature: 0,
  operatingHours: 0,
  unitPowerPercentage: 0,
  lowerHeatingValue: 0,
};

calculationResponseData: CalculationResponse = {
  gasConsumption: 0,
  Unit: "",
  calculationTime: ""
};

msg:string = "";
isSuccessfull:boolean=false;

calculate () {
  this.msg = "";
  this.isSuccessfull = false;
  this.calculationRequestData.stationId = this.selectedStationId;
  this._calculator.calculateConsumption(({ ...this.calculationRequestData})).subscribe({
      next: (result) => {
        if (typeof result === 'number'){
        this.msg = `Что-то пошло не так. Код ошибки (${result})`;
        }
        else {
          this.isSuccessfull = true;
          this.calculationResponseData = result;
        }
      },
      error: (error) => {
        this.msg = "Ошибка. Попробуйте ещё раз.";
      }
    });
}

}
