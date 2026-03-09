import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
import { GasConsumptionService, GasConsumption } from '../../services/gas-consumption.service/gas-consumption.service';
import { HttpErrorResponse } from '@angular/common/http';
Chart.register(...registerables);

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    added: number;
    updated: number;
    errors: number;
  };
}

interface ExcelRow {
  date: string;
  gasConsumption: number;
}

@Component({
  selector: 'app-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data.html',
  styleUrls: ['./data.css']
})
export class Data implements OnInit, OnChanges, AfterViewInit {
  @Input() selectedStationId!: number;
  @ViewChild('gasChart') chartCanvas!: ElementRef;

  userRole: string | null = null;
  
  // Данные
  data: GasConsumption[] = [];
  filteredData: GasConsumption[] = [];
  
  // График
  chart: Chart | null = null;
  chartType: 'line' | 'bar' = 'line';
  isChartCollapsed = false;
  
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
  previewData: ExcelRow[] = [];

  // Состояния загрузки
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private gasConsumptionService: GasConsumptionService
  ) {
    this.userRole = sessionStorage.getItem('userRole') || null;
  }

  ngOnInit() {
    if (this.selectedStationId) {
      this.loadData();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.createChart(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedStationId']) {
      const newStationId = changes['selectedStationId'].currentValue;
      console.log('Station ID изменился на:', newStationId);
      if (newStationId) {
        this.loadData();
      } else {
        this.filteredData = [];
        if (this.chart) {
          this.chart.destroy();
          this.chart = null;
        }
      }
    }
  }

  // ===== CRUD операции =====
  
  loadData() {
    if (!this.selectedStationId) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    this.gasConsumptionService.getByStation(this.selectedStationId).subscribe({
      next: (res) => {
        console.log(res);
        if (Array.isArray(res)) {
          this.data = res;
          this.filterDataByStation();
        } else {
          this.errorMessage = `Ошибка загрузки: код ${res}`;
          this.data = [];
          this.filteredData = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Не удалось загрузить данные';
        this.isLoading = false;
        console.error('Ошибка загрузки:', err);
      }
    });
  }

  filterDataByStation() {
    if (this.selectedStationId && this.data) {
      this.filteredData = this.data.filter(item => item.electricalStationId === this.selectedStationId);
      this.filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTimeout(() => this.updateChart(), 100);
    } else {
      this.filteredData = [];
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  openAddDataForm() {
    this.isEditing = false;
    this.newData = {
      date: '',
      gasConsumption: 0
    };
    this.showDataForm = true;
  }

openEditDataForm(record: GasConsumption) {
  this.isEditing = true;
  this.editingId = record.id || null;
  
  // Форматируем дату для input type="date" (YYYY-MM-DD)
  const dateObj = new Date(record.date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  this.newData = {
    date: formattedDate,
    gasConsumption: record.consumption
  };
  this.showDataForm = true;
}

  closeDataForm() {
    this.showDataForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = null;
  }
addData() {
  if (!this.selectedStationId) {
    alert('Станция не выбрана');
    return;
  }

  // Проверяем, что дата выбрана
  if (!this.newData.date) {
    alert('Выберите дату');
    return;
  }

  // Проверяем, что расход больше 0
  if (this.newData.gasConsumption <= 0) {
    alert('Расход газа должен быть больше 0');
    return;
  }

  // Для type="date" приходит значение в формате YYYY-MM-DD
  // Добавляем время, чтобы создать полноценную дату
  const formattedDate = `${this.newData.date}T00:00:00`;

  const newRecord = {
    electricalStationId: this.selectedStationId,
    date: formattedDate,
    consumption: this.newData.gasConsumption
  };

  console.log('Отправляемые данные:', newRecord);

  this.gasConsumptionService.create(newRecord).subscribe({
    next: (status) => {
      console.log('Ответ сервера, статус:', status);
      if (status === 201) {
        this.loadData();
        this.closeDataForm();
      } else if (status === 409) {
        alert('Запись за эту дату уже существует');
      } else {
        alert(`Ошибка при добавлении: код ${status}`);
      }
    },
    error: (err) => {
      console.error('Детали ошибки:', err);
      
      // Пытаемся получить сообщение об ошибке от сервера
      if (err.error) {
        console.error('Ответ сервера с ошибкой:', err.error);
        if (err.error.message) {
          alert(`Ошибка: ${err.error.message}`);
        } else if (err.error.title) {
          alert(`Ошибка: ${err.error.title}`);
        } else {
          alert('Не удалось добавить запись. Проверьте формат даты.');
        }
      } else {
        alert('Не удалось добавить запись. Проверьте соединение с сервером.');
      }
    }
  });
}
  updateData() {
  if (!this.editingId) {
    alert('ID записи не найден');
    return;
  }

  if (!this.selectedStationId) {
    alert('Станция не выбрана');
    return;
  }

  if (!this.newData.date) {
    alert('Выберите дату');
    return;
  }

  if (this.newData.gasConsumption <= 0) {
    alert('Расход газа должен быть больше 0');
    return;
  }

  // Для type="date" приходит значение в формате YYYY-MM-DD
  const formattedDate = `${this.newData.date}T00:00:00`;

  const updatedRecord = {
    id: this.editingId,
    electricalStationId: this.selectedStationId,
    date: formattedDate,
    consumption: this.newData.gasConsumption
  };

  console.log('Обновление записи:', updatedRecord);

  this.gasConsumptionService.update(this.editingId, updatedRecord).subscribe({
    next: (status) => {
      console.log('Статус ответа при обновлении:', status);
      
      if (status === 200 || status === 204) {
        this.loadData();
        this.closeDataForm();
      } else if (status === 400) {
        alert('Ошибка в формате данных. Проверьте введенные значения.');
      } else if (status === 404) {
        alert('Запись не найдена. Возможно, она была удалена.');
        this.loadData();
        this.closeDataForm();
      } else if (status === 409) {
        alert('Запись за эту дату уже существует у другой записи');
      } else {
        alert(`Ошибка при обновлении: код ${status}`);
      }
    },
    error: (err) => {
      console.error('Детали ошибки при обновлении:', err);
      
      if (err.error) {
        console.error('Ответ сервера с ошибкой:', err.error);
        if (err.error.message) {
          alert(`Ошибка: ${err.error.message}`);
        } else if (err.error.title) {
          alert(`Ошибка: ${err.error.title}`);
        } else {
          alert('Не удалось обновить запись. Проверьте формат даты.');
        }
      } else {
        alert('Не удалось обновить запись. Проверьте соединение с сервером.');
      }
    }
  });
}
  deleteData(id: number) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

    this.gasConsumptionService.delete(id).subscribe({
      next: (status) => {
        if (status === 204) {
          this.loadData(); // Перезагружаем данные
        } else if (status === 404) {
          alert('Запись не найдена');
        } else {
          alert(`Ошибка при удалении: код ${status}`);
        }
      },
      error: (err) => {
        console.error('Ошибка при удалении:', err);
        alert('Не удалось удалить запись');
      }
    });
  }

  // ===== Методы для Excel =====

  importFromExcel() {
    this.showExcelModal = true;
    this.selectedFile = null;
    this.importResult = null;
    this.previewData = [];
    this.importProgress = 0;
    this.errorMessage = null;
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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
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
    this.readExcelFile(file);
  }

  readExcelFile(file: File) {
  const reader = new FileReader();
  
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Берем первый лист
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Конвертируем в JSON
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
      
      // Парсим данные
      const parsedData: ExcelRow[] = [];
      
      for (const row of jsonData) {
        // Пытаемся найти колонки по разным возможным названиям
        const dateValue = row['Дата'] || row['дата'] || row['DATE'] || row['date'] || row['День'] || row['день'];
        const consumptionValue = row['Расход газа'] || row['расход'] || row['CONSUMPTION'] || 
                                 row['consumption'] || row['Расход'] || row['расход газа'] || 
                                 row['Газ'] || row['газ'];
        
        if (dateValue && consumptionValue) {
          // Парсим дату - теперь всегда с днем!
          let formattedDate = '';
          
          // 1. Формат YYYY-MM-DD (например, 2026-01-15)
          if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = dateValue;
          }
          // 2. Формат DD.MM.YYYY (например, 15.01.2026)
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
            const [day, month, year] = dateValue.split('.');
            formattedDate = `${year}-${month}-${day}`;
          }
          // 3. Формат DD/MM/YYYY (например, 15/01/2026)
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = dateValue.split('/');
            formattedDate = `${year}-${month}-${day}`;
          }
          // 4. Формат YYYY-MM (только месяц) - добавляем первый день месяца
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}$/)) {
            formattedDate = `${dateValue}-01`;
          }
          // 5. Формат MM.YYYY (только месяц) - добавляем первый день месяца
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{4}$/)) {
            const [month, year] = dateValue.split('.');
            formattedDate = `${year}-${month}-01`;
          }
          // 6. Формат MM/YYYY (только месяц) - добавляем первый день месяца
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{4}$/)) {
            const [month, year] = dateValue.split('/');
            formattedDate = `${year}-${month}-01`;
          }
          // 7. Excel дата (число дней с 1900 года)
          else if (typeof dateValue === 'number') {
            try {
              // Используем JS Date для преобразования Excel даты
              // Excel дата 1 = 1 января 1900
              const excelEpoch = new Date(1899, 11, 30); // 30 декабря 1899
              const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              
              formattedDate = `${year}-${month}-${day}`;
            } catch (e) {
              console.warn('Не удалось распарсить Excel дату:', dateValue);
              continue;
            }
          }
          // 8. Любой другой формат - пробуем распарсить через new Date()
          else {
            try {
              const date = new Date(dateValue);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
              } else {
                console.warn('Неверный формат даты:', dateValue);
                continue;
              }
            } catch (e) {
              console.warn('Не удалось распарсить дату:', dateValue);
              continue;
            }
          }
          
          if (formattedDate) {
            parsedData.push({
              date: formattedDate, // Теперь всегда YYYY-MM-DD
              gasConsumption: parseFloat(consumptionValue) || 0
            });
          }
        }
      }
      
      // Берем первые 5 для предпросмотра
      this.previewData = parsedData.slice(0, 5);
      
    } catch (error) {
      console.error('Ошибка при чтении Excel:', error);
      this.errorMessage = 'Не удалось прочитать файл. Проверьте формат.';
    }
  };
  
  reader.readAsArrayBuffer(file);
}

  processExcelFile() {
  if (!this.selectedFile) {
    alert('Выберите файл для импорта');
    return;
  }

  if (!this.selectedStationId) {
    alert('Станция не выбрана');
    return;
  }

  this.isImporting = true;
  this.importProgress = 0;
  this.importResult = null;

  // Читаем файл
  const reader = new FileReader();
  
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Берем первый лист
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Конвертируем в JSON
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
      
      console.log('Прочитано строк из Excel:', jsonData.length);
      
      if (jsonData.length === 0) {
        this.importResult = {
          success: false,
          message: 'Файл не содержит данных',
          details: { added: 0, updated: 0, errors: 0 }
        };
        this.isImporting = false;
        return;
      }
      
      // Парсим все данные
      const records: any[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // +2 потому что 1 - заголовок, плюс человекочитаемый номер
        
        // Пытаемся найти колонки по разным возможным названиям
        const dateValue = row['Дата'] || row['дата'] || row['DATE'] || row['date'] || row['Месяц'] || row['месяц'] || row['День'] || row['день'];
        const consumptionValue = row['Расход газа'] || row['расход'] || row['CONSUMPTION'] || 
                                 row['consumption'] || row['Расход'] || row['расход газа'] || 
                                 row['Газ'] || row['газ'];
        
        if (!dateValue) {
          errors.push(`Строка ${rowNumber}: не найдена колонка с датой`);
          continue;
        }
        
        if (!consumptionValue) {
          errors.push(`Строка ${rowNumber}: не найдена колонка с расходом газа`);
          continue;
        }
        
        // Парсим дату - теперь всегда с днем!
        let formattedDate = '';
        
        // Поддерживаем различные форматы дат
        
        // 1. Формат YYYY-MM-DD (например, 2026-01-15)
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = dateValue;
        } 
        // 2. Формат DD.MM.YYYY (например, 15.01.2026)
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateValue.split('.');
          formattedDate = `${year}-${month}-${day}`;
        }
        // 3. Формат DD/MM/YYYY (например, 15/01/2026)
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = dateValue.split('/');
          formattedDate = `${year}-${month}-${day}`;
        }
        // 4. Формат YYYY-MM (только месяц) - добавляем первый день месяца
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}$/)) {
          formattedDate = `${dateValue}-01`;
        } 
        // 5. Формат MM.YYYY (только месяц) - добавляем первый день месяца
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{4}$/)) {
          const [month, year] = dateValue.split('.');
          formattedDate = `${year}-${month}-01`;
        }
        // 6. Формат MM/YYYY (только месяц) - добавляем первый день месяца
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{4}$/)) {
          const [month, year] = dateValue.split('/');
          formattedDate = `${year}-${month}-01`;
        }
        // 7. Excel дата (число дней с 1900 года)
        else if (typeof dateValue === 'number') {
          try {
            // Используем JS Date для преобразования Excel даты
            // Excel дата 1 = 1 января 1900
            const excelEpoch = new Date(1899, 11, 30); // 30 декабря 1899
            const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            formattedDate = `${year}-${month}-${day}`;
          } catch (e) {
            errors.push(`Строка ${rowNumber}: не удалось распарсить дату (числовой формат)`);
            continue;
          }
        } 
        // 8. Любой другой формат - пробуем распарсить через new Date()
        else {
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            } else {
              errors.push(`Строка ${rowNumber}: неверный формат даты: "${dateValue}"`);
              continue;
            }
          } catch (e) {
            errors.push(`Строка ${rowNumber}: не удалось распарсить дату: "${dateValue}"`);
            continue;
          }
        }
        
        // Парсим расход
        let consumption = 0;
        if (typeof consumptionValue === 'number') {
          consumption = consumptionValue;
        } else if (typeof consumptionValue === 'string') {
          // Заменяем запятую на точку и убираем пробелы
          const cleanedStr = consumptionValue.replace(/,/g, '.').replace(/\s/g, '');
          consumption = parseFloat(cleanedStr) || 0;
        }
        
        if (consumption <= 0) {
          errors.push(`Строка ${rowNumber}: расход газа должен быть больше 0, получено: "${consumptionValue}"`);
          continue;
        }
        
        records.push({
          electricalStationId: this.selectedStationId,
          date: formattedDate + 'T00:00:00', // Добавляем время для сервера
          consumption: consumption
        });
      }
      
      console.log('Подготовлено записей для импорта:', records.length);
      console.log('Ошибки парсинга:', errors);
      
      if (records.length === 0) {
        this.importResult = {
          success: false,
          message: `Нет корректных записей для импорта. Ошибок: ${errors.length}`,
          details: { added: 0, updated: 0, errors: errors.length }
        };
        this.isImporting = false;
        return;
      }
      
      // Показываем предпросмотр если есть ошибки
      if (errors.length > 0) {
        this.previewData = records.slice(0, 5).map(r => ({
          date: r.date.substring(0, 10), // YYYY-MM-DD
          gasConsumption: r.consumption
        }));
        
        if (!confirm(`Найдено ${errors.length} ошибок в файле. Продолжить импорт ${records.length} корректных записей?`)) {
          this.isImporting = false;
          return;
        }
      } else {
        // Если ошибок нет, показываем предпросмотр первых 5 записей
        this.previewData = records.slice(0, 5).map(r => ({
          date: r.date.substring(0, 10), // YYYY-MM-DD
          gasConsumption: r.consumption
        }));
      }
      
      // Имитируем прогресс для UX
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        this.importProgress = progress;
      }, 100);
      
      // Отправляем на сервер
      this.gasConsumptionService.bulkCreateOrUpdate(this.selectedStationId, records).subscribe({
        next: (res) => {
          clearInterval(interval);
          this.importProgress = 100;
          
          console.log('Ответ от сервера при импорте:', res);
          
          if (typeof res === 'number') {
            // Ошибка - пришел код статуса
            this.importResult = {
              success: false,
              message: `Ошибка импорта: код ${res}`,
              details: { 
                added: 0, 
                updated: 0, 
                errors: records.length 
              }
            };
          } else {
            // Успешный импорт
            const addedCount = res.created?.length || 0;
            const updatedCount = res.updated?.length || 0;
            
            this.importResult = {
              success: true,
              message: res.message || 'Данные успешно импортированы',
              details: { 
                added: addedCount, 
                updated: updatedCount, 
                errors: errors.length 
              }
            };
            
            // Перезагружаем данные
            this.loadData();
          }
          
          this.isImporting = false;
        },
        error: (err) => {
          clearInterval(interval);
          console.error('Ошибка при импорте:', err);
          
          let errorMessage = 'Ошибка при импорте данных';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.importResult = {
            success: false,
            message: errorMessage,
            details: { 
              added: 0, 
              updated: 0, 
              errors: records.length 
            }
          };
          
          this.isImporting = false;
          this.importProgress = 0;
        }
      });
      
    } catch (error) {
      console.error('Ошибка при обработке Excel файла:', error);
      
      this.importResult = {
        success: false,
        message: 'Ошибка при чтении файла. Проверьте формат.',
        details: { added: 0, updated: 0, errors: 0 }
      };
      
      this.isImporting = false;
      this.importProgress = 0;
    }
  };
  
  reader.onerror = (error) => {
    console.error('Ошибка чтения файла:', error);
    
    this.importResult = {
      success: false,
      message: 'Не удалось прочитать файл',
      details: { added: 0, updated: 0, errors: 0 }
    };
    
    this.isImporting = false;
    this.importProgress = 0;
  };
  
  reader.readAsArrayBuffer(this.selectedFile);
}

  exportToExcel() {
    if (this.filteredData.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    try {
      const excelData = this.filteredData.map(item => ({
        'Дата': this.formatDateForExcel(item.date),
        'Расход газа (тыс. м³)': item.consumption
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные по расходу газа');
      
      const colWidths = [
        { wch: 15 }, // Дата
        { wch: 20 }  // Расход
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

  // ===== Методы для графика =====

  toggleChartCollapse() {
    this.isChartCollapsed = !this.isChartCollapsed;
    setTimeout(() => {
      if (!this.isChartCollapsed && this.filteredData.length > 0) {
        this.updateChart();
      }
    }, 300);
  }

  createChart() {
    if (!this.chartCanvas || this.filteredData.length === 0 || this.isChartCollapsed) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const sortedData = [...this.filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const labels = sortedData.map(item => this.formatDateForChart(item.date));
    const values = sortedData.map(item => item.consumption);

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
              font: { size: 11 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'тыс. м³',
              font: { size: 10 }
            },
            ticks: { font: { size: 10 } }
          },
          x: {
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
    if (!this.chartCanvas || this.filteredData.length === 0 || this.isChartCollapsed) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    const sortedData = [...this.filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const labels = sortedData.map(item => this.formatDateForChart(item.date));
    const values = sortedData.map(item => item.consumption);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    } else {
      this.createChart();
    }
  }

  toggleChartType() {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    setTimeout(() => this.createChart(), 50);
  }

  // ===== Вспомогательные методы =====
// Для отображения в таблице (можно оставить как есть или изменить формат)
formatDisplayDate(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`; // Теперь отображает ДД.ММ.ГГГГ
}

// Для графика (можно оставить как есть или тоже изменить)
formatDateForChart(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
                     'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

// Для Excel
formatDateForExcel(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

  // ===== Статистика =====
  
  getAverageConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    const sum = this.filteredData.reduce((acc, item) => acc + item.consumption, 0);
    return sum / this.filteredData.length;
  }

  getMaxConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    return Math.max(...this.filteredData.map(item => item.consumption));
  }

  getMinConsumption(): number {
    if (this.filteredData.length === 0) return 0;
    return Math.min(...this.filteredData.map(item => item.consumption));
  }

  getTotalConsumption(): number {
    return this.filteredData.reduce((acc, item) => acc + item.consumption, 0);
  }
}