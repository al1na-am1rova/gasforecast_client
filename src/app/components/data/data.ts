import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface GasData {
  id: number;
  stationId: number;
  date: string;
  gasConsumption: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    added: number;
    updated: number;
    errors: number;
  };
}

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data.html',
  styleUrls: ['./data.css']
})
export class Data implements OnChanges, AfterViewInit {
  @Input() selectedStationId!: number;
  @ViewChild('gasChart') chartCanvas!: ElementRef;

  userRole: string | null = null;
  
  // Данные
  data: GasData[] = [];
  filteredData: GasData[] = [];
  
  // График
  chart: Chart | null = null;
  chartType: 'line' | 'bar' = 'line';
  isChartCollapsed = false; // Новое поле для сворачивания графика
  
  // Форма
  showDataForm = false;
  isEditing = false;
  editingId: number | null = null;
  
  newData = {
    date: '',
    gasConsumption: 0
  };

  // Excel импорт
  showExcelModal = false;
  selectedFile: File | null = null;
  isDragging = false;
  isImporting = false;
  importProgress = 0;
  importResult: ImportResult | null = null;
  previewData: any[] = [];

  constructor() {
    this.userRole = sessionStorage.getItem('userRole') || null;
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.createChart(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStationId']) {
      const newStationId = changes['selectedStationId'].currentValue;
      console.log('Station ID изменился на:', newStationId);
      this.filterDataByStation();
    }
  }

  loadData() {
    const mockData: GasData[] = [
      { id: 1, stationId: 1, date: '2023-01', gasConsumption: 1250.5 },
      { id: 2, stationId: 1, date: '2023-02', gasConsumption: 1180.3 },
      { id: 3, stationId: 1, date: '2023-03', gasConsumption: 1340.7 },
      { id: 4, stationId: 1, date: '2023-04', gasConsumption: 1290.2 },
      { id: 5, stationId: 2, date: '2023-01', gasConsumption: 980.4 },
      { id: 6, stationId: 2, date: '2023-02', gasConsumption: 1020.6 },
      { id: 7, stationId: 3, date: '2023-01', gasConsumption: 450.2 },
      { id: 8, stationId: 3, date: '2023-02', gasConsumption: 520.8 },
      { id: 9, stationId: 1, date: '2023-05', gasConsumption: 1410.3 },
      { id: 10, stationId: 1, date: '2023-06', gasConsumption: 1380.9 },
    ];
    
    this.data = mockData;
    this.filterDataByStation();
  }

  filterDataByStation() {
    if (this.selectedStationId) {
      console.log('Фильтрация для станции ID:', this.selectedStationId);
      this.filteredData = this.data.filter(item => item.stationId === this.selectedStationId);
      setTimeout(() => this.updateChart(), 100);
    } else {
      this.filteredData = [];
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  // Переключение сворачивания графика
  toggleChartCollapse() {
    this.isChartCollapsed = !this.isChartCollapsed;
    // Даем время на анимацию сворачивания, затем обновляем график
    setTimeout(() => {
      if (!this.isChartCollapsed && this.filteredData.length > 0) {
        this.updateChart();
      }
    }, 300);
  }

  // Создание графика
  createChart() {
    if (!this.chartCanvas || this.filteredData.length === 0 || this.isChartCollapsed) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const sortedData = [...this.filteredData].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sortedData.map(item => this.formatDateForChart(item.date));
    const values = sortedData.map(item => item.gasConsumption);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: {
        labels: labels,
        datasets: [{
          label: 'Расход газа (тыс. м³)',
          data: values,
          backgroundColor: 'rgba(41, 128, 185, 0.2)',
          borderColor: '#2980b9',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 4
        }]
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
              font: {
                size: 11
              }
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'тыс. м³',
              font: {
                size: 10
              }
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 10
              },
              maxRotation: 45,
              minRotation: 30
            }
          }
        }
      }
    });
  }

  // Обновление графика
  updateChart() {
    if (!this.chartCanvas || this.filteredData.length === 0 || this.isChartCollapsed) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    const sortedData = [...this.filteredData].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sortedData.map(item => this.formatDateForChart(item.date));
    const values = sortedData.map(item => item.gasConsumption);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    } else {
      this.createChart();
    }
  }

  // Смена типа графика
  toggleChartType() {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    setTimeout(() => this.createChart(), 50);
  }

  // Форматирование даты для графика
  formatDateForChart(date: string): string {
    const [year, month] = date.split('-');
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
                       'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Статистика
  getAverageConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    const sum = this.filteredData.reduce((acc, item) => acc + item.gasConsumption, 0);
    return sum / this.filteredData.length;
  }

  getMaxConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    return Math.max(...this.filteredData.map(item => item.gasConsumption));
  }

  getMinConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    return Math.min(...this.filteredData.map(item => item.gasConsumption));
  }

  getTotalConsumption(): number {
    return this.filteredData.reduce((acc, item) => acc + item.gasConsumption, 0);
  }

  // Excel методы
  importFromExcel() {
    this.showExcelModal = true;
    this.selectedFile = null;
    this.importResult = null;
    this.previewData = [];
    this.importProgress = 0;
  }

  closeExcelModal() {
    this.showExcelModal = false;
    this.selectedFile = null;
    this.isImporting = false;
    this.importResult = null;
    this.previewData = [];
  }

  triggerFileInput(event: Event) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File) {
    this.selectedFile = file;
    this.previewFile(file);
  }

  previewFile(file: File) {
    console.log('Preview file:', file.name);
    
    this.previewData = [
      { date: '2024-01', gasConsumption: 1500.5 },
      { date: '2024-02', gasConsumption: 1620.3 },
      { date: '2024-03', gasConsumption: 1480.7 },
      { date: '2024-04', gasConsumption: 1590.2 },
      { date: '2024-05', gasConsumption: 1710.8 }
    ];
  }

  processExcelFile() {
    if (!this.selectedFile || !this.selectedStationId) return;

    this.isImporting = true;
    this.importProgress = 0;
    this.importResult = null;

    const interval = setInterval(() => {
      this.importProgress += 10;
      
      if (this.importProgress >= 100) {
        clearInterval(interval);
        
        const newRecords: GasData[] = [
          { 
            id: Math.max(0, ...this.data.map(d => d.id)) + 1, 
            stationId: this.selectedStationId, 
            date: '2024-01', 
            gasConsumption: 1500.5 
          },
          { 
            id: Math.max(0, ...this.data.map(d => d.id)) + 2, 
            stationId: this.selectedStationId, 
            date: '2024-02', 
            gasConsumption: 1620.3 
          },
        ];

        this.data = [...this.data, ...newRecords];
        this.filterDataByStation();

        this.importResult = {
          success: true,
          message: 'Данные успешно импортированы',
          details: {
            added: 2,
            updated: 0,
            errors: 0
          }
        };

        this.isImporting = false;
      }
    }, 300);
  }

  exportToExcel() {
    if (this.filteredData.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    try {
      const excelData = this.filteredData.map(item => ({
        'Дата': item.date,
        'Расход газа (тыс. м³)': item.gasConsumption
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные по расходу газа');
      
      const colWidths = [
        { wch: 15 },
        { wch: 20 }
      ];
      worksheet['!cols'] = colWidths;
      
      const fileName = `gas_consumption_station_${this.selectedStationId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      console.log('Данные успешно экспортированы в Excel');
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      alert('Ошибка при экспорте данных. Попробуйте ещё раз.');
    }
  }

  // CRUD операции
  openAddDataForm() {
    this.isEditing = false;
    this.newData = {
      date: '',
      gasConsumption: 0
    };
    this.showDataForm = true;
  }

  openEditDataForm(record: GasData) {
    this.isEditing = true;
    this.editingId = record.id;
    this.newData = {
      date: record.date,
      gasConsumption: record.gasConsumption
    };
    this.showDataForm = true;
  }

  closeDataForm() {
    this.showDataForm = false;
    this.isEditing = false;
    this.editingId = null;
  }

  addData() {
    if (!this.selectedStationId) {
      alert('Станция не выбрана');
      return;
    }

    const newRecord: GasData = {
      id: Math.max(0, ...this.data.map(d => d.id)) + 1,
      stationId: this.selectedStationId,
      date: this.newData.date,
      gasConsumption: this.newData.gasConsumption
    };
    
    this.data.push(newRecord);
    this.filterDataByStation();
    this.closeDataForm();
  }

  updateData() {
    const index = this.data.findIndex(item => item.id === this.editingId);
    if (index !== -1) {
      this.data[index] = {
        ...this.data[index],
        date: this.newData.date,
        gasConsumption: this.newData.gasConsumption
      };
    }
    
    this.filterDataByStation();
    this.closeDataForm();
  }

  deleteData(id: number) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.data = this.data.filter(item => item.id !== id);
      this.filterDataByStation();
    }
  }

  formatDisplayDate(date: string): string {
    const [year, month] = date.split('-');
    return `${month}.${year}`;
  }
}