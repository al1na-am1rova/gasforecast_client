import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Интерфейс для расхода газа
export interface GasConsumption {
  id?: number;
  electricalStationId: number;
  date: string | Date;
  consumption: number;
}

@Injectable({
  providedIn: 'root',
})
export class GasConsumptionService {
  private apiUrl = `/api`;

  constructor(private http: HttpClient) { }

  // 1) Получить все записи для станции
  getByStation(stationId: number): Observable<GasConsumption[] | number> {
    return this.http.get<any>(`${this.apiUrl}/GasConsumption/read/${stationId}`, { observe: 'response' })
      .pipe(
        map(res => res.status === 200 ? res.body as GasConsumption[] : res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 2) Получить одну запись по ID
  getById(id: number): Observable<GasConsumption | number> {
    return this.http.get<any>(`${this.apiUrl}/GasConsumption/${id}`, { observe: 'response' })
      .pipe(
        map(res => res.status === 200 ? res.body as GasConsumption : res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 3) Добавить одну запись (если существует → ошибка)
  create(consumption: GasConsumption): Observable<number> {
    return this.http.post<any>(`${this.apiUrl}/GasConsumption/create`, consumption, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 4) Добавить или обновить одну запись
  createOrUpdate(consumption: GasConsumption): Observable<number> {
    return this.http.post<any>(`${this.apiUrl}/GasConsumption/create-or-update`, consumption, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 5) Массовое добавление (если хоть одна существует → всё отменяется)
  bulkCreate(stationId: number, consumptions: GasConsumption[]): Observable<number> {
    return this.http.post<any>(`${this.apiUrl}/GasConsumption/bulk-create?stationId=${stationId}`, consumptions, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 6) Массовое добавление с перезаписью
  bulkCreateOrUpdate(stationId: number, consumptions: GasConsumption[]): Observable<any | number> {
    return this.http.post<any>(`${this.apiUrl}/GasConsumption/bulk-create-or-update?stationId=${stationId}`, consumptions, { observe: 'response' })
      .pipe(
        map(res => res.status === 200 ? res.body : res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 7) Обновить запись по ID - ИСПРАВЛЕНО: добавил слеш
  update(id: number, consumption: GasConsumption): Observable<number> {
    return this.http.put<any>(`${this.apiUrl}/GasConsumption/edit/${id}`, consumption, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 8) Удалить запись по ID - ИСПРАВЛЕНО: добавил слеш
  delete(id: number): Observable<number> {
    return this.http.delete<any>(`${this.apiUrl}/GasConsumption/delete/${id}`, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }

  // 9) Массовое удаление по датам
  bulkDelete(stationId: number, dates: (string | Date)[]): Observable<any | number> {
    return this.http.delete<any>(`${this.apiUrl}/GasConsumption/bulk-delete?stationId=${stationId}`, { 
      body: dates,
      observe: 'response' 
    })
      .pipe(
        map(res => res.status === 200 ? res.body : res.status),
        catchError((error: HttpErrorResponse) => of(error.status))
      );
  }
}