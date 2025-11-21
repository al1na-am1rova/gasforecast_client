import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Station} from '../../components/gasforecast/gasforecastModels';


@Injectable({
  providedIn: 'root',
})
export class StationsService {
  
  private apiUrl = `/api`;
  
  constructor(private http: HttpClient) { }

  get getStations(): Observable<Station[] | number> {
  return this.http.get<any>(`${this.apiUrl}/ElectricityPowerStation/read_all`, {observe:'response'})
    .pipe(
      map(res => res.status === 200 ? res.body as Station[] : res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    );
  }

}