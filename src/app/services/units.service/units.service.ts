import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Unit} from '../../components/stations/stationsModels';

@Injectable({
  providedIn: 'root',
})
export class UnitsService {
  private apiUrl = `/api`;
  
  constructor(private http: HttpClient) { }

  get getUnits(): Observable<Unit[] | number> {
  return this.http.get<any>(`${this.apiUrl}/ElectricalUnitPassport/read_all`, {observe:'response'})
    .pipe(
      map(res => res.status === 200 ? res.body as Unit[] : res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    );
  }

  public addUnit(info: {unitType: string, engineType:string, ratedPower:number, standartPower:number,consumptionNorm:number }): Observable<number> {
    const newUnitData = {
      unitType: info.unitType,
      engineType: info.engineType,
      ratedPower: info.ratedPower,
      standartPower: info.standartPower,
      consumptionNorm: info.consumptionNorm
      };

    return this.http.post<any>(`${this.apiUrl}/ElectricalUnitPassport/create`, newUnitData, { observe: 'response' })
      .pipe(
        map(res => {
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
    }

  public deleteUnit(id:number): Observable<number> {
  return this.http.delete<any>(`${this.apiUrl}/ElectricalUnitPassport/delete/${id}`, { observe: 'response' })
      .pipe(
        map(res => {
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
    }
  
    public editUnit(id:number, info: {unitType: string, engineType:string, ratedPower:number, standartPower:number,consumptionNorm:number }): Observable<number> {
    const newUnitData = {
      unitType: info.unitType,
      engineType: info.engineType,
      ratedPower: info.ratedPower,
      standartPower: info.standartPower,
      consumptionNorm: info.consumptionNorm
      };

    return this.http.put<any>(`${this.apiUrl}/ElectricalUnitPassport/update/${id}`, newUnitData, { observe: 'response' })
      .pipe(
        map(res => {
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
    }
}
