import { Component, Input, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import { 
  Forecast, 
  ModelInfo, 
  MonthlyForecast, 
  PredictionResponse,
  DailyDataPoint,
  AnomalyCheckResponse,
  TrainWithCheckResponse
} from '../../services/forecast.service/forecast';
import { MatDialog } from '@angular/material/dialog';
import { AnomalyConfirmationDialog } from '../anomaly-confirmation-dialog/anomaly-confirmation-dialog';

Chart.register(...registerables);

interface DailyData {
  date: string;
  consumption: number;
}

interface MonthlyData {
  month: string;
  actual: number | null;
  predicted: number | null;
}

interface AnomalyForChart {
  month: string;
  value: number;
  date: string;
  isAnomaly: boolean;
}

export interface CombinedData {
  historical: MonthlyForecast[];
  forecast: MonthlyForecast[];
  modelInfo: ModelInfo;
}

@Component({
  selector: 'app-gb-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gb-forecast.html',
  styleUrls: ['./gb-forecast.css']
})
export class GbForecast implements OnInit, OnChanges, AfterViewInit {

  @Input() selectedStationId!: number;
  @ViewChild('forecastChart') chartCanvas!: ElementRef;
  
  userRole: string | null = null;

  // Данные для формы
  predictionMonth: string = '';
  
  // Результат предсказания
  predictionResult: PredictionResponse | null = null;
  
  // Информация о модели
  modelInfo: ModelInfo | null = null;
  
  // Данные
  dailyData: DailyData[] = [];
  monthlyData: MonthlyData[] = [];
  anomaliesData: AnomalyForChart[] = [];
  
  // Состояния
  isLoading = false;
  isPredicting = false;
  isTraining = false;
  isCheckingData = false;
  errorMessage: string | null = null;
  
  // График
  chart: Chart | null = null;
  isChartCollapsed = false;
  
  // Период отображения
  pastMonthsCount: number = 6;
  futureMonthsCount: number = 3;
  
  pendingDataForTraining: DailyData[] | null = null;
  
  constructor(
    private forecastService: Forecast, 
    private dialog: MatDialog
  ) {
    this.userRole = sessionStorage.getItem('userRole') || null;
  }
  
  ngOnInit() {
    if (this.selectedStationId) {
      this.loadModelInfo();
      this.loadData();
    }
    
    // Устанавливаем дату по умолчанию (следующий месяц)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.predictionMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }
  
  ngAfterViewInit() {
    this.createChart();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStationId']) {
      const newStationId = changes['selectedStationId'].currentValue;
      console.log('GbForecast: Station ID изменился на:', newStationId);
      
      if (newStationId) {
        this.resetPrediction();
        this.loadModelInfo();
        this.loadData();
      } else {
        this.resetAll();
      }
    }
  }
  
  // ===== ЗАГРУЗКА ДАННЫХ =====
  
  loadModelInfo() {
    if (!this.selectedStationId) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.forecastService.getModelInfo(this.selectedStationId).subscribe({
      next: (info) => {
        this.modelInfo = info;
        this.isLoading = false;
        
        if (!info.exists && info.dataPoints >= 30) {
          console.log('Модель не обучена, но данных достаточно для обучения');
        }
      },
      error: (err) => {
        this.errorMessage = 'Не удалось загрузить информацию о модели';
        this.isLoading = false;
        console.error('Error loading model info:', err);
      }
    });
  }
  
  loadData() {
    if (!this.selectedStationId) return;
    
    this.isLoading = true;
    
    this.forecastService.getCombinedData(this.selectedStationId, this.futureMonthsCount).subscribe({
      next: (combined: CombinedData) => {
        console.log('Полученные данные:', combined);
        
        if (combined.historical && combined.historical.length > 0) {
          this.monthlyData = combined.historical.map((h: MonthlyForecast) => ({
            month: h.month,
            actual: h.predicted,
            predicted: null
          }));
        } else {
          this.monthlyData = [];
        }
        
        if (combined.modelInfo && combined.modelInfo.exists && combined.forecast && combined.forecast.length > 0) {
          const forecastData = combined.forecast.map((f: MonthlyForecast) => ({
            month: f.month,
            actual: null,
            predicted: f.predicted
          }));
          this.monthlyData = [...this.monthlyData, ...forecastData];
        }
        
        if (combined.modelInfo) {
          this.modelInfo = combined.modelInfo;
        }
        
        this.isLoading = false;
        
        // Загружаем аномалии для отображения на графике
        this.loadAnomaliesForChart();
        
        this.updateChart();
      },
      error: (err) => {
        console.error('Error loading combined data:', err);
        this.errorMessage = 'Не удалось загрузить данные';
        this.isLoading = false;
      }
    });
  }
  
  loadAnomaliesForChart() {
    if (!this.selectedStationId) return;
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    this.forecastService.getStationDailyData(this.selectedStationId, startDateStr, endDate).subscribe({
      next: (dailyData: DailyDataPoint[]) => {
        // Сохраняем аномалии для использования в графике
        this.anomaliesData = this.aggregateAnomaliesByMonth(dailyData);
        this.updateChart();
      },
      error: (err) => {
        console.error('Error loading anomalies:', err);
      }
    });
  }
  
  // Агрегация аномалий по месяцам для отображения на графике
  aggregateAnomaliesByMonth(dailyData: DailyDataPoint[]): AnomalyForChart[] {
    // Если у данных нет флагов аномалий, возвращаем пустой массив
    // В реальном API нужно получать данные с флагами is_anomaly
    return [];
  }
  
  // ===== ПРОВЕРКА АНОМАЛИЙ И ОБУЧЕНИЕ =====
  
  async triggerTrainingWithCheck() {
    if (!this.selectedStationId) return;
    
    this.isCheckingData = true;
    this.errorMessage = null;
    
    try {
      // 1. Загружаем последние 60 дней данных для проверки
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const dailyData = await firstValueFrom(
        this.forecastService.getStationDailyData(this.selectedStationId, startDateStr, endDate)
      );
      
      if (!dailyData || dailyData.length === 0) {
        // Если нет новых данных, просто запускаем обучение
        this.triggerTrainingLegacy();
        return;
      }
      
      // 2. Проверяем данные на аномалии
      const checkResult = await firstValueFrom(
        this.forecastService.checkDataForAnomalies(this.selectedStationId, dailyData)
      );
      
      if (!checkResult) {
        this.triggerTrainingLegacy();
        return;
      }
      
      // 3. Если есть аномалии — показываем диалог
      if (checkResult.has_anomalies || checkResult.has_warnings) {
        this.pendingDataForTraining = dailyData.map(d => ({ date: d.date, consumption: d.consumption }));
        
        const dialogRef = this.dialog.open(AnomalyConfirmationDialog, {
          data: checkResult,
          width: '600px',
          disableClose: true
        });
        
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
          if (confirmed) {
            // Пользователь подтвердил — обучаем с аномалиями
            this.trainWithConfirmedAnomalies(dailyData);
          } else {
            this.errorMessage = 'Обучение отменено. Пожалуйста, проверьте данные.';
            this.pendingDataForTraining = null;
          }
          this.isCheckingData = false;
        });
      } else {
        // Нет аномалий — обучаем сразу
        this.trainWithConfirmedAnomalies(dailyData);
      }
      
    } catch (err) {
      console.error('Error checking anomalies:', err);
      // При ошибке проверки все равно предлагаем обучить
      this.triggerTrainingLegacy();
    } finally {
      this.isCheckingData = false;
    }
  }
  
  trainWithConfirmedAnomalies(data: DailyDataPoint[]) {
    if (!this.selectedStationId) return;
    
    this.isTraining = true;
    this.errorMessage = null;
    
    this.forecastService.trainModelWithCheck({
      stationId: this.selectedStationId,
      data: data,
      forceRetrain: true,
      confirmAnomalies: true
    }).subscribe({
      next: (response: TrainWithCheckResponse) => {
        if (response.status === 'requires_confirmation') {
          this.errorMessage = response.message;
          this.isTraining = false;
        } else if (response.status === 'started' || response.status === 'success') {
          this.errorMessage = 'Обучение модели запущено. Это может занять несколько минут.';
          this.checkTrainingStatus();
        } else {
          this.errorMessage = response.message || 'Ошибка при обучении';
          this.isTraining = false;
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Не удалось запустить обучение модели';
        this.isTraining = false;
        console.error('Training error:', err);
      }
    });
  }
  
  triggerTrainingLegacy() {
    if (!this.selectedStationId) return;
    
    this.isTraining = true;
    this.errorMessage = null;
    
    this.forecastService.trainModel(this.selectedStationId, true).subscribe({
      next: () => {
        this.errorMessage = 'Обучение модели запущено. Это может занять несколько минут.';
        this.checkTrainingStatus();
      },
      error: (err) => {
        this.errorMessage = 'Не удалось запустить обучение модели';
        this.isTraining = false;
        console.error('Training error:', err);
      }
    });
  }
  
  triggerTraining() {
    this.triggerTrainingWithCheck();
  }
  
  checkTrainingStatus() {
    let attempts = 0;
    const maxAttempts = 24; // 2 минуты
    
    const interval = setInterval(() => {
      attempts++;
      
      this.forecastService.getModelInfo(this.selectedStationId).subscribe({
        next: (info) => {
          if (info.exists) {
            clearInterval(interval);
            this.isTraining = false;
            this.errorMessage = 'Модель успешно обучена! Обновляем данные...';
            this.loadData();
            setTimeout(() => {
              if (this.errorMessage === 'Модель успешно обучена! Обновляем данные...') {
                this.errorMessage = null;
              }
            }, 3000);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.isTraining = false;
            this.errorMessage = 'Обучение занимает больше времени, чем ожидалось';
          }
        },
        error: () => {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.isTraining = false;
          }
        }
      });
    }, 5000);
  }
  
  // ===== ПРОГНОЗИРОВАНИЕ =====
  
  makePrediction() {
    if (!this.selectedStationId) {
      this.errorMessage = 'Сначала выберите станцию';
      return;
    }
    
    if (!this.predictionMonth) {
      this.errorMessage = 'Выберите месяц для прогноза';
      return;
    }
    
    this.isPredicting = true;
    this.errorMessage = null;
    this.predictionResult = null;
    
    const request = {
      stationId: this.selectedStationId,
      month: this.predictionMonth
    };
    
    this.forecastService.predict(request).subscribe({
      next: (result) => {
        this.predictionResult = result;
        this.isPredicting = false;
        
        // Обновляем данные
        const existingIndex = this.monthlyData.findIndex(m => m.month === this.predictionMonth);
        if (existingIndex >= 0) {
          this.monthlyData[existingIndex].predicted = result.predictedConsumption;
        } else {
          this.monthlyData.push({
            month: this.predictionMonth,
            actual: null,
            predicted: result.predictedConsumption
          });
          this.monthlyData.sort((a, b) => a.month.localeCompare(b.month));
        }
        
        this.updateChart();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Ошибка при получении прогноза';
        this.isPredicting = false;
        console.error('Prediction error:', err);
      }
    });
  }
  
  // ===== ГРАФИК =====
  
  toggleChartCollapse() {
    this.isChartCollapsed = !this.isChartCollapsed;
    if (!this.isChartCollapsed && this.monthlyData.length > 0) {
      this.updateChart();
    }
  }
  
  createChart() {
    if (!this.chartCanvas || this.isChartCollapsed || this.monthlyData.length === 0) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.monthlyData.map(item => this.formatMonthForChart(item.month));
    const actualData = this.monthlyData.map(item => item.actual);
    const predictedData = this.modelInfo?.exists ? this.monthlyData.map(item => item.predicted) : [];
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const datasets: any[] = [
      {
        label: 'Фактический расход',
        data: actualData,
        borderColor: '#2980b9',
        backgroundColor: 'rgba(41, 128, 185, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#2980b9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
        spanGaps: true
      }
    ];
    
    if (this.modelInfo?.exists && predictedData.some(v => v !== null)) {
      datasets.push({
        label: 'Прогноз',
        data: predictedData,
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#e67e22',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: false,
        spanGaps: true
      });
    }
    
    // Добавляем датасет для аномалий, если есть
    if (this.anomaliesData && this.anomaliesData.length > 0) {
      datasets.push({
        label: '⚠️ Аномалии',
        data: this.anomaliesData.map(a => a.value),
        backgroundColor: '#e74c3c',
        borderColor: '#e74c3c',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'triangle',
        type: 'scatter',
        showLine: false,
        order: 1
      });
    }
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                if (value === null || value === undefined) return 'Нет данных';
                return `${context.dataset.label}: ${value.toFixed(2)} тыс. м³`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'тыс. м³ (за месяц)',
              font: { size: 10 }
            },
            ticks: { font: { size: 10 } }
          },
          x: {
            title: {
              display: true,
              text: 'Месяц',
              font: { size: 10 }
            },
            ticks: {
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 30
            }
          }
        }
      }
    });
  }
  
  updateChart() {
    if (!this.chartCanvas || this.isChartCollapsed || this.monthlyData.length === 0) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }
    
    const labels = this.monthlyData.map(item => this.formatMonthForChart(item.month));
    const actualData = this.monthlyData.map(item => item.actual);
    const predictedData = this.monthlyData.map(item => item.predicted);
    
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = actualData as any[];
      if (this.chart.data.datasets[1]) {
        this.chart.data.datasets[1].data = predictedData as any[];
      }
      this.chart.update();
    } else {
      this.createChart();
    }
  }
  
  updateChartWithAnomalies() {
    this.updateChart();
  }
  
  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
  
  formatMonthForDisplay(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  
  formatMonthForChart(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
                        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  
  getMinMonth(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  
  getMaxMonth(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`;
  }
  
  resetPrediction() {
    this.predictionResult = null;
    this.errorMessage = null;
  }
  
  resetAll() {
    this.predictionResult = null;
    this.modelInfo = null;
    this.dailyData = [];
    this.monthlyData = [];
    this.anomaliesData = [];
    this.errorMessage = null;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  // ===== СТАТИСТИКА =====
  
  getAverageMonthlyActual(): number {
    const actuals = this.monthlyData
      .filter(m => m.actual !== null)
      .map(m => m.actual as number);
    if (actuals.length === 0) return 0;
    return actuals.reduce((a, b) => a + b, 0) / actuals.length;
  }
  
  getTotalForecast(): number {
    if (!this.modelInfo?.exists) return 0;
    
    const forecasts = this.monthlyData
      .filter(m => m.predicted !== null && m.actual === null)
      .map(m => m.predicted as number);
    if (forecasts.length === 0) return 0;
    return forecasts.reduce((a, b) => a + b, 0);
  }
  
  getMaxMonthlyActual(): number {
    const actuals = this.monthlyData
      .filter(m => m.actual !== null)
      .map(m => m.actual as number);
    if (actuals.length === 0) return 0;
    return Math.max(...actuals);
  }
  
  getMinMonthlyActual(): number {
    const actuals = this.monthlyData
      .filter(m => m.actual !== null)
      .map(m => m.actual as number);
    if (actuals.length === 0) return 0;
    return Math.min(...actuals);
  }
  
  getForecastMonthsCount(): number {
    return this.monthlyData.filter(m => m.predicted !== null && m.actual === null).length;
  }
  
  showForecast(): boolean {
    return this.modelInfo?.exists === true && this.monthlyData.some(m => m.predicted !== null);
  }
}