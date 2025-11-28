import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Station } from '../../components/stationsUnits/stationsUnitsModels';

export interface CalculationRequest {
  stationId: number;
  outsideTemperature: number;
  operatingHours: number;
  unitPowerPercentage: number;
  lowerHeatingValue: number;
}

export interface CalculationResponse {
  gasConsumption: number;
  Unit: string;
  calculationTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConsumptionCalculateService {
  private apiUrl = `/api`;
  
  constructor(private http: HttpClient) { }

  public calculateConsumption(info: CalculationRequest): Observable<CalculationResponse | number> {
  return this.http.post<CalculationResponse>(`${this.apiUrl}/ElectricityConsumptionCalculation/calculate`, info, {
    observe: 'response'
  })
  .pipe(
    map(res => res.status === 200 && res.body ? res.body : res.status),
    catchError((error: HttpErrorResponse) => of(error.status))
  );
}
}