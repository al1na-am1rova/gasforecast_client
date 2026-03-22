import { Component, Input, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { 
  Forecast, 
  ModelInfo, 
  MonthlyForecast, 
  PredictionResponse 
} from '../../services/forecast.service/forecast';

Chart.register(...registerables);

interface DailyData {
  date: string;        // YYYY-MM-DD
  consumption: number;
}

interface MonthlyData {
  month: string;       // YYYY-MM
  actual: number | null;     // сумма за месяц (факт)
  predicted: number | null;  // прогноз на месяц
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
  
    // Добавьте в класс
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
  
  // Состояния
  isLoading = false;
  isPredicting = false;
  isTraining = false;
  errorMessage: string | null = null;
  
  // График
  chart: Chart | null = null;
  isChartCollapsed = false;
  
  // Период отображения
  pastMonthsCount: number = 6;
  futureMonthsCount: number = 3;
  
  constructor(private forecastService: Forecast) {
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
  
  // ===== Загрузка данных =====
  
  loadModelInfo() {
    if (!this.selectedStationId) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.forecastService.getModelInfo(this.selectedStationId).subscribe({
      next: (info) => {
        this.modelInfo = info;
        this.isLoading = false;
        
        // Если модели нет, но есть данные (больше 30 записей), можно показать сообщение
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
      
      // Добавляем прогноз ТОЛЬКО если модель существует
      if (combined.modelInfo && combined.modelInfo.exists && combined.forecast && combined.forecast.length > 0) {
        const forecastData = combined.forecast.map((f: MonthlyForecast) => ({
          month: f.month,
          actual: null,
          predicted: f.predicted
        }));
        this.monthlyData = [...this.monthlyData, ...forecastData];
      } else {
        console.log('Модель не обучена, отображаем только фактические данные');
      }
      
      // Обновляем информацию о модели
      if (combined.modelInfo) {
        this.modelInfo = combined.modelInfo;
      }
      
      this.isLoading = false;
      this.updateChart();
    },
    error: (err) => {
      console.error('Error loading combined data:', err);
      this.errorMessage = 'Не удалось загрузить данные';
      this.isLoading = false;
    }
  });
}
  
  // ===== Прогнозирование =====
  
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
  
  // ===== График =====
  
  toggleChartCollapse() {
    this.isChartCollapsed = !this.isChartCollapsed;
    if (!this.isChartCollapsed && this.monthlyData.length > 0) {
        this.updateChart();
      };
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
  
  const datasets = [
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
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { size: 11 }
          }
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
          ticks: { 
            font: { size: 10 }
          }
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
      this.chart.data.datasets[0].data = actualData;
      this.chart.data.datasets[1].data = predictedData;
      this.chart.update();
    } else {
      this.createChart();
    }
  }
  
  // ===== Вспомогательные методы =====
  
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
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')} - 2`;
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
    this.errorMessage = null;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  // ===== Статистика =====
  
  getAverageMonthlyActual(): number {
    const actuals = this.monthlyData
      .filter(m => m.actual !== null)
      .map(m => m.actual as number);
    if (actuals.length === 0) return 0;
    return actuals.reduce((a, b) => a + b, 0) / actuals.length;
  }
  
 getTotalForecast(): number {
  // Возвращаем 0, если модель не обучена
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

triggerTraining() {
  if (!this.selectedStationId) return;
  
  this.isTraining = true;
  this.errorMessage = null;
  
  this.forecastService.trainModel(this.selectedStationId, true).subscribe({
    next: () => {
      this.errorMessage = 'Обучение модели запущено. Это может занять несколько минут.';
      this.isTraining = false;
      // Проверяем статус
      this.checkTrainingStatus();
    },
    error: (err) => {
      this.errorMessage = 'Не удалось запустить обучение модели';
      this.isTraining = false;
      console.error('Training error:', err);
    }
  });
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
          if (this.errorMessage === 'Модель успешно обучена! Обновляем данные...') {
              this.errorMessage = null;
            };
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          this.isTraining = false;
          this.errorMessage = 'Обучение занимает больше времени, чем ожидалось';
        }
      },
      error: () => {}
    });
  }, 5000);
}
}