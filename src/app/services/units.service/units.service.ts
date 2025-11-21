import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {Unit} from '../../components/gasforecast/gasforecastModels';

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
}
