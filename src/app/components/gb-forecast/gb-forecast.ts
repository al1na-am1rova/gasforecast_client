import { Component, Input, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ForecastResponse {
  stationId: number;
  date: string;        // YYYY-MM
  predictedConsumption: number;
  confidence: number;
  modelVersion: string;
}

interface ModelInfo {
  stationId: number;
  exists: boolean;
  version: string | null;
  lastTrained: string | null;
  dataPoints: number;
  accuracyMape: number | null;
}

interface DailyData {
  date: string;        // YYYY-MM-DD
  consumption: number;
}

interface MonthlyData {
  month: string;       // YYYY-MM
  actual: number | null;     // сумма за месяц (факт)
  predicted: number | null;  // прогноз на месяц
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
  
  // Данные для формы
  predictionMonth: string = '';
  
  // Результат предсказания
  predictionResult: ForecastResponse | null = null;
  
  // Информация о модели
  modelInfo: ModelInfo | null = null;
  
  // Данные
  dailyData: DailyData[] = [];
  monthlyData: MonthlyData[] = [];
  
  // Состояния
  isLoading = false;
  isPredicting = false;
  errorMessage: string | null = null;
  
  // График
  chart: Chart | null = null;
  isChartCollapsed = false;
  
  // Период отображения (количество месяцев назад и вперед)
  pastMonthsCount: number = 6;
  futureMonthsCount: number = 3;
  
  constructor() {}
  
  ngOnInit() {
    if (this.selectedStationId) {
      this.loadModelInfo();
      this.loadDailyData();
    }
    
    // Устанавливаем дату по умолчанию (следующий месяц)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.predictionMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }
  
  ngAfterViewInit() {
    setTimeout(() => this.createChart(), 100);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStationId']) {
      const newStationId = changes['selectedStationId'].currentValue;
      console.log('GbForecast: Station ID изменился на:', newStationId);
      
      if (newStationId) {
        this.resetPrediction();
        this.loadModelInfo();
        this.loadDailyData();
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
    
    // TODO: Подключить реальный сервис
    setTimeout(() => {
      this.modelInfo = {
        stationId: this.selectedStationId,
        exists: true,
        version: 'v1.2.3',
        lastTrained: '2024-03-21T14:30:22',
        dataPoints: 187,
        accuracyMape: 8.5
      };
      this.isLoading = false;
    }, 500);
  }
  
  loadDailyData() {
    if (!this.selectedStationId) return;
    
    // TODO: Подключить реальный сервис для получения ежедневных данных
    setTimeout(() => {
      const data: DailyData[] = [];
      const now = new Date();
      
      // Генерируем данные за последние 180 дней
      for (let i = 180; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        
        // Добавляем сезонность и случайность
        const month = date.getMonth();
        const seasonalFactor = 1 + Math.sin(month * Math.PI / 6) * 0.3;
        const random = 0.8 + Math.random() * 0.4;
        
        const consumption = 100 * seasonalFactor * random;
        
        data.push({
          date: date.toISOString().slice(0, 10),
          consumption: Math.round(consumption * 10) / 10
        });
      }
      
      this.dailyData = data;
      this.aggregateMonthlyData();
      this.loadMonthlyForecast();
      setTimeout(() => this.updateChart(), 100);
    }, 300);
  }
  
  // Агрегация дневных данных в месячные суммы
  aggregateMonthlyData() {
    const monthlyMap = new Map<string, number>();
    
    this.dailyData.forEach(day => {
      const month = day.date.slice(0, 7); // YYYY-MM
      const currentSum = monthlyMap.get(month) || 0;
      monthlyMap.set(month, currentSum + day.consumption);
    });
    
    // Получаем последние 6 месяцев
    const months = Array.from(monthlyMap.keys()).sort().slice(-this.pastMonthsCount);
    
    this.monthlyData = months.map(month => ({
      month: month,
      actual: monthlyMap.get(month) || null,
      predicted: null
    }));
    
    console.log('Агрегированные месячные данные:', this.monthlyData);
  }
  
  loadMonthlyForecast() {
    if (!this.selectedStationId || this.dailyData.length === 0) return;
    
    // TODO: Получить прогноз на несколько месяцев вперед
    setTimeout(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // Получаем среднемесячный расход за последние 3 месяца
      const last3Months = this.monthlyData.slice(-3);
      const avgMonthly = last3Months.reduce((sum, m) => sum + (m.actual || 0), 0) / last3Months.length;
      
      // Генерируем прогноз на будущие месяцы
      const futureForecasts: MonthlyData[] = [];
      
      for (let i = 1; i <= this.futureMonthsCount; i++) {
        const forecastDate = new Date(currentYear, currentMonth + i, 1);
        const monthStr = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Сезонный коэффициент
        const month = forecastDate.getMonth();
        const seasonalFactor = 1 + Math.sin(month * Math.PI / 6) * 0.25;
        
        // Прогноз на основе среднего + сезонности + небольшой тренд
        const predicted = avgMonthly * seasonalFactor * (1 + i * 0.02);
        
        futureForecasts.push({
          month: monthStr,
          actual: null,
          predicted: Math.round(predicted * 10) / 10
        });
      }
      
      // Объединяем исторические данные и прогноз
      this.monthlyData = [...this.monthlyData, ...futureForecasts];
      
      console.log('Месячные данные с прогнозом:', this.monthlyData);
      this.updateChart();
    }, 300);
  }
  
  // ===== Прогнозирование на конкретный месяц =====
  
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
    
    console.log('Отправка запроса на прогноз:', request);
    
    // TODO: Подключить реальный сервис
    setTimeout(() => {
      // Ищем существующий прогноз
      let predictedValue = 0;
      const existing = this.monthlyData.find(m => m.month === this.predictionMonth);
      
      if (existing && existing.predicted) {
        predictedValue = existing.predicted;
      } else {
        // Генерируем на основе исторических данных
        const last3Months = this.monthlyData
          .filter(m => m.actual !== null)
          .slice(-3);
        
        const avgMonthly = last3Months.reduce((sum, m) => sum + (m.actual || 0), 0) / last3Months.length;
        
        const [year, month] = this.predictionMonth.split('-');
        const monthNum = parseInt(month) - 1;
        const seasonalFactor = 1 + Math.sin(monthNum * Math.PI / 6) * 0.25;
        
        predictedValue = avgMonthly * seasonalFactor;
        predictedValue = Math.round(predictedValue * 10) / 10;
      }
      
      this.predictionResult = {
        stationId: this.selectedStationId,
        date: this.predictionMonth,
        predictedConsumption: predictedValue,
        confidence: 0.85 + Math.random() * 0.1,
        modelVersion: this.modelInfo?.version || 'v1.0.0'
      };
      this.isPredicting = false;
      
      // Обновляем данные
      const existingIndex = this.monthlyData.findIndex(m => m.month === this.predictionMonth);
      if (existingIndex >= 0) {
        this.monthlyData[existingIndex].predicted = predictedValue;
      } else {
        this.monthlyData.push({
          month: this.predictionMonth,
          actual: null,
          predicted: predictedValue
        });
        this.monthlyData.sort((a, b) => a.month.localeCompare(b.month));
      }
      
      this.updateChart();
    }, 800);
  }
  
  // ===== График =====
  
  toggleChartCollapse() {
    this.isChartCollapsed = !this.isChartCollapsed;
    setTimeout(() => {
      if (!this.isChartCollapsed && this.monthlyData.length > 0) {
        this.updateChart();
      }
    }, 300);
  }
  
  createChart() {
  if (!this.chartCanvas || this.isChartCollapsed || this.monthlyData.length === 0) return;
  
  const ctx = this.chartCanvas.nativeElement.getContext('2d');
  
  const labels = this.monthlyData.map(item => this.formatMonthForChart(item.month));
  const actualData = this.monthlyData.map(item => item.actual);
  const predictedData = this.monthlyData.map(item => item.predicted);
  
  if (this.chart) {
    this.chart.destroy();
  }
  
  this.chart = new Chart(ctx, {
    type: 'line',  // Меняем с 'bar' на 'line'
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Фактический расход (месяц)',
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
        },
        {
          label: 'Прогноз',
          data: predictedData,
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#e67e22',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: false,
          spanGaps: true
        }
      ]
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
            font: { size: 10 },
            callback: (value) => value.toLocaleString()
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
    this.errorMessage = null;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
  
  // Статистика
  getAverageMonthlyActual(): number {
    const actuals = this.monthlyData
      .filter(m => m.actual !== null)
      .map(m => m.actual as number);
    if (actuals.length === 0) return 0;
    return actuals.reduce((a, b) => a + b, 0) / actuals.length;
  }
  
  getTotalForecast(): number {
    const forecasts = this.monthlyData
      .filter(m => m.predicted !== null)
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

  getForecastMonthsCount(): number {
  return this.monthlyData.filter(m => m.predicted !== null && m.actual === null).length;
}
}