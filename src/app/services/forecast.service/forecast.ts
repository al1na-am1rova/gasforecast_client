// src/app/services/forecast.service/forecast.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


export interface ModelInfo {
  stationId: number;
  exists: boolean;
  version: string | null;
  lastTrained: string | null;
  dataPoints: number;
  accuracyMape: number | null;
}

export interface MonthlyForecast {
  month: string;      // YYYY-MM
  predicted: number;
}

export interface PredictionRequest {
  stationId: number;
  month: string;      // YYYY-MM
}

export interface PredictionResponse {
  stationId: number;
  date: string;       // YYYY-MM
  predictedConsumption: number;
  confidence: number;
  modelVersion: string;
  status: string;
  message?: string;
}

export interface BatchForecastRequest {
  stationId: number;
  startMonth: string;  // YYYY-MM
  endMonth: string;    // YYYY-MM
}

export interface BatchForecastResponse {
  stationId: number;
  forecasts: MonthlyForecast[];
  modelVersion: string;
}

export interface TrainingStatus {
  stationId: number;
  status: 'pending' | 'training' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  modelVersion?: string;
}

export interface AnomalyPoint {
  date: string;
  value: number;
  is_anomaly: boolean;
  is_warning: boolean;
  z_score: number | null;
  historical_mean: number | null;
  historical_std: number | null;
  history_count: number;
  message: string;
}

export interface AnomalyCheckResponse {
  stationId: number;
  hasAnomalies: boolean;
  hasWarnings: boolean;
  totalChecked: number;
  anomalyCount: number;
  warningCount: number;
  anomalies: AnomalyPoint[];
  recommendation: string;
  canProceed: boolean;
  needsConfirmation: boolean;
}

export interface TrainWithCheckRequest {
  stationId: number;
  data: DailyData[];
  forceRetrain?: boolean;
  confirmAnomalies?: boolean;
}

export interface DailyData {
  date: string;
  consumption: number;
}

export interface TrainWithCheckResponse {
  stationId: number;
  status: string;
  message: string;
  requires_confirmation?: boolean;
  anomaly_report?: AnomalyCheckResponse;
}


export interface DailyDataPoint {
  date: string;
  consumption: number;
  is_anomaly?: boolean;
  is_warning?: boolean;
  z_score?: number | null;
  historical_mean?: number | null;
  historical_std?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class Forecast {
  constructor(private http: HttpClient) {}

   private apiUrl = `/api`;
  /**
   * Получить информацию о модели для станции
   */
  getModelInfo(stationId: number): Observable<ModelInfo> {
    return this.http.get<ModelInfo>(`${this.apiUrl}/forecast/models/${stationId}/info`)
      .pipe(
        timeout(10000),
        catchError(this.handleError<ModelInfo>('getModelInfo', { 
          stationId: stationId, 
          exists: false, 
          version: null, 
          lastTrained: null, 
          dataPoints: 0, 
          accuracyMape: null 
        }))
      );
  }

  /**
   * Сделать прогноз на месяц
   */
  predict(request: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(`${this.apiUrl}/forecast/predict-month`, request)
      .pipe(
        timeout(30000),
        catchError(this.handleError<PredictionResponse>('predict'))
      );
  }

  /**
   * Получить прогноз на несколько месяцев вперед
   */
  getMonthlyForecast(stationId: number, months: number = 3): Observable<MonthlyForecast[]> {
    return this.http.get<MonthlyForecast[]>(`${this.apiUrl}/forecast/${stationId}/monthly`, {
      params: { months: months.toString() }
    }).pipe(
      timeout(15000),
      catchError(this.handleError<MonthlyForecast[]>('getMonthlyForecast', []))
    );
  }

  /**
   * Получить прогноз на период
   */
  getForecastForPeriod(request: BatchForecastRequest): Observable<BatchForecastResponse> {
    return this.http.post<BatchForecastResponse>(`${this.apiUrl}/forecast/batch`, request)
      .pipe(
        timeout(30000),
        catchError(this.handleError<BatchForecastResponse>('getForecastForPeriod'))
      );
  }

  /**
   * Запустить обучение модели для станции
   */
  trainModel(stationId: number, forceRetrain: boolean = false): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(
      `${this.apiUrl}/forecast/train/${stationId}`,
      null,
      { params: { force: forceRetrain.toString() } }
    ).pipe(
      timeout(10000),
      catchError(this.handleError<{ message: string; status: string }>('trainModel'))
    );
  }

  /**
   * Получить статус обучения модели
   */
  getTrainingStatus(stationId: number): Observable<TrainingStatus> {
    return this.http.get<TrainingStatus>(`${this.apiUrl}/forecast/training/${stationId}/status`)
      .pipe(
        timeout(5000),
        catchError(this.handleError<TrainingStatus>('getTrainingStatus', { 
          stationId: stationId, 
          status: 'pending',
          message: 'Статус неизвестен'
        }))
      );
  }

  /**
   * Проверить здоровье ML сервиса
   */
  checkMLHealth(): Observable<{ status: string; modelsLoaded: number; databaseConnected: boolean }> {
    return this.http.get<{ status: string; modelsLoaded: number; databaseConnected: boolean }>(
      `${this.apiUrl}/health`
    ).pipe(
      timeout(5000),
      catchError(() => of({ status: 'unhealthy', modelsLoaded: 0, databaseConnected: false }))
    );
  }

  /**
   * Получить исторические данные для графика (агрегированные по месяцам)
   */
  getHistoricalMonthlyData(stationId: number, monthsBack: number = 6): Observable<MonthlyForecast[]> {
    return this.http.get<MonthlyForecast[]>(`${this.apiUrl}/forecast/data/${stationId}/monthly`, {
      params: { monthsBack: monthsBack.toString() }
    }).pipe(
      timeout(10000),
      catchError(this.handleError<MonthlyForecast[]>('getHistoricalMonthlyData', []))
    );
  }

  /**
   * Получить комбинированные данные (история + прогноз)
   */
 /**
 * Получить комбинированные данные (история + прогноз)
 */
getCombinedData(stationId: number, forecastMonths: number = 3): Observable<{
  historical: MonthlyForecast[];
  forecast: MonthlyForecast[];
  modelInfo: ModelInfo;
}> {
  return this.http.get<{
    historical: MonthlyForecast[];
    forecast: MonthlyForecast[];
    modelInfo: ModelInfo;
  }>(`${this.apiUrl}/forecast/${stationId}/combined`, {
    params: { forecastMonths: forecastMonths.toString() }
  }).pipe(
    timeout(15000),
    catchError(this.handleError<{
      historical: MonthlyForecast[];
      forecast: MonthlyForecast[];
      modelInfo: ModelInfo;
    }>('getCombinedData', {
      historical: [],
      forecast: [],
      modelInfo: {
        stationId: stationId,
        exists: false,
        version: null,
        lastTrained: null,
        dataPoints: 0,
        accuracyMape: null
      }
    }))
  );
}

  /**
   * Обработка ошибок
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      let errorMessage = 'Произошла ошибка';
      
      if (error.error instanceof ErrorEvent) {
        // Клиентская ошибка
        errorMessage = error.error.message;
      } else {
        // Серверная ошибка
        switch (error.status) {
          case 0:
            errorMessage = 'Не удалось соединиться с сервером';
            break;
          case 404:
            errorMessage = 'Сервис не найден';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера';
            break;
          default:
            errorMessage = error.error?.message || `Ошибка ${error.status}`;
        }
      }
      
      // Можно добавить логирование в сервис логирования
      console.error(`${operation}: ${errorMessage}`);
      
      // Возвращаем результат по умолчанию или пробрасываем ошибку
      if (result !== undefined) {
        return of(result);
      }
      return throwError(() => new Error(errorMessage));
    };
  }

checkDataForAnomalies(stationId: number, data: DailyData[]): Observable<AnomalyCheckResponse> {
  return this.http.post<AnomalyCheckResponse>(`${this.apiUrl}/forecast/check-data`, {
    stationId: stationId,
    data: data
  }).pipe(
    timeout(15000),
    catchError(this.handleError<AnomalyCheckResponse>('checkDataForAnomalies'))
  );
}

/**
 * Обучение модели с проверкой аномалий
 */
trainModelWithCheck(request: TrainWithCheckRequest): Observable<TrainWithCheckResponse> {
  return this.http.post<TrainWithCheckResponse>(`${this.apiUrl}/forecast/train-with-check`, request)
    .pipe(
      timeout(30000),
      catchError(this.handleError<TrainWithCheckResponse>('trainModelWithCheck'))
    );
}

/**
 * Получить ежедневные данные станции для проверки
 */
getStationDailyData(stationId: number, startDate?: string, endDate?: string): Observable<DailyData[]> {
  let params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  return this.http.get<DailyData[]>(`${this.apiUrl}/forecast/data/${stationId}/daily`, { params })
    .pipe(
      timeout(12000),
      catchError(this.handleError<DailyData[]>('getStationDailyData', []))
    );
}
}