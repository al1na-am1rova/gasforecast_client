import { ConsumptionCalculateService, CalculationRequest, CalculationResponse} from '../../services/consumption-calculate.service/consumption-calculate.service';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calculator',
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
  standalone: true
})
export class Calculator implements OnChanges { // Добавляем implements OnChanges
  constructor(private _calculator: ConsumptionCalculateService) {}
  
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

  msg: string = "";
  isSuccessfull: boolean = false;

  // Этот метод вызывается при каждом изменении входных параметров
  ngOnChanges(changes: SimpleChanges) {
    // Проверяем, изменился ли selectedStationId
    if (changes['selectedStationId']) {
      const newStationId = changes['selectedStationId'].currentValue;
      console.log('Calculator: Station ID изменился на:', newStationId);
      
      // Обновляем stationId в запросе
      this.calculationRequestData.stationId = newStationId || 0;
      
      // Сбрасываем результаты предыдущего расчета
      this.resetCalculation();
    }
  }

  // Сброс результатов расчета
  resetCalculation() {
    this.calculationResponseData = {
      gasConsumption: 0,
      Unit: "",
      calculationTime: ""
    };
    this.msg = "";
    this.isSuccessfull = false;
  }

  calculate() {
    // Проверяем, выбрана ли станция
    if (!this.selectedStationId) {
      this.msg = "Сначала выберите станцию";
      return;
    }

    this.msg = "";
    this.isSuccessfull = false;
    
    // Убеждаемся, что stationId актуален
    this.calculationRequestData.stationId = this.selectedStationId;
    
    console.log('Отправка запроса с данными:', this.calculationRequestData);
    
    this._calculator.calculateConsumption({ ...this.calculationRequestData }).subscribe({
      next: (result) => {
        if (typeof result === 'number') {
          this.msg = `Что-то пошло не так. Код ошибки (${result})`;
          this.isSuccessfull = false;
        } else {
          this.isSuccessfull = true;
          this.calculationResponseData = result;
          this.msg = "Расчет выполнен успешно";
        }
      },
      error: (error) => {
        console.error('Ошибка расчета:', error);
        this.msg = "Ошибка. Попробуйте ещё раз.";
        this.isSuccessfull = false;
      }
    });
  }

  // Валидация полей формы
  isFormValid(): boolean {
    return this.selectedStationId > 0 &&
           this.calculationRequestData.outsideTemperature !== null &&
           this.calculationRequestData.operatingHours > 0 &&
           this.calculationRequestData.unitPowerPercentage > 0 &&
           this.calculationRequestData.lowerHeatingValue > 0;
  }

  // Сброс формы
  resetForm() {
    this.calculationRequestData = {
      stationId: this.selectedStationId || 0,
      outsideTemperature: 0,
      operatingHours: 0,
      unitPowerPercentage: 0,
      lowerHeatingValue: 0,
    };
    this.resetCalculation();
  }
}