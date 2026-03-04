import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

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
export class Data implements OnChanges {
  @Input() selectedStationId!: number;

  userRole: string | null = null;
  
  // Данные
  data: GasData[] = [];
  filteredData: GasData[] = [];
  
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
    ];
    
    this.data = mockData;
    this.filterDataByStation();
  }

  filterDataByStation() {
    if (this.selectedStationId) {
      console.log('Фильтрация для станции ID:', this.selectedStationId);
      this.filteredData = this.data.filter(item => item.stationId === this.selectedStationId);
    } else {
      this.filteredData = [];
    }
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
    // Здесь должна быть логика чтения Excel файла
    // Для демонстрации используем mock данные
    console.log('Preview file:', file.name);
    
    // Создаем тестовые данные для предпросмотра
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

    // Имитация процесса импорта
    const interval = setInterval(() => {
      this.importProgress += 10;
      
      if (this.importProgress >= 100) {
        clearInterval(interval);
        
        // Имитация успешного импорта
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
    // Подготавливаем данные для Excel
    const excelData = this.filteredData.map(item => ({
      'Дата': item.date,
      'Расход газа (тыс. м³)': item.gasConsumption
    }));

    // Создаем рабочий лист
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные по расходу газа');
    
    // Настраиваем ширину колонок
    const colWidths = [
      { wch: 15 }, // Дата
      { wch: 20 }  // Расход газа
    ];
    worksheet['!cols'] = colWidths;
    
    // Формируем имя файла
    const fileName = `gas_consumption_station_${this.selectedStationId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Сохраняем файл
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