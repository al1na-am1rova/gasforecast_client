import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Station} from '../../components/stations/stationsModels';


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

  public addStation(info: {name: string, unitType: string, launchDate:string, activeUnitsCount:number }): Observable<number> {
    const newStationData = {
      name: info.name,
      unitType: info.unitType,
      launchDate:info.launchDate,
      activeUnitsCount:info.activeUnitsCount
      };

    return this.http.post<any>(`${this.apiUrl}/ElectricityPowerStation/add`, newStationData, { observe: 'response' })
      .pipe(
        map(res => {
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
  }

  public deleteStation(id:number): Observable<number> {
  return this.http.delete<any>(`${this.apiUrl}/ElectricityPowerStation/delete/${id}`, { observe: 'response' })
      .pipe(
        map(res => {
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
    }

  public editStation(id:number, info: {name: string, unitType: string, launchDate:string, activeUnitsCount:number }): Observable<number> {
    const newStationData = {
      name: info.name,
      unitType: info.unitType,
      launchDate:info.launchDate,
      activeUnitsCount:info.activeUnitsCount
      };

    return this.http.put<any>(`${this.apiUrl}/ElectricityPowerStation/update/${id}`, newStationData, { observe: 'response' })
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