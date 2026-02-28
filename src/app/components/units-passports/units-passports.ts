import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Unit } from './units-passports-model';
import { UnitsService } from '../../services/units.service/units.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-units-table',
  templateUrl: './units-passports.html',
  styleUrls: ['./units-passports.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class UnitsPassports implements OnInit, OnChanges {
  @Input() userRole: string | null = null;
  @Input() units: Unit[] = [];
  @Output() unitsChange = new EventEmitter<Unit[]>();
  @Output() close = new EventEmitter<void>();
  @Output() navigateToLogin = new EventEmitter<void>();

  // Локальные переменные для работы с таблицей
  filteredUnits: Unit[] = [];
  searchTermUnits: string = '';
  sortColumnUnits: string = '';
  sortDirectionUnits: 'asc' | 'desc' = 'asc';
  
  // Переменные для модальных окон
  showAddUnitForm = false;
  editingUnit: Unit | null = null;
  uMsg: string = '';
  showDeleteConfirmation = false;
  itemToDelete: any = null;
  deleteCallback: Function | null = null;
  
  newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower: 0,
    consumptionNorm: 0
  };

  constructor(
    private _units: UnitsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.filterUnits();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['units'] && changes['units'].currentValue) {
      this.filterUnits();
    }
  }

  // Фильтрация и сортировка
  filterUnits() {
    if (!this.searchTermUnits) {
      this.filteredUnits = [...this.units];
    } else {
      const term = this.searchTermUnits.toLowerCase();
      this.filteredUnits = this.units.filter(unit =>
        unit.unitType.toLowerCase().includes(term)
      );
    }
    this.applySort();
  }

  clearSearchUnits() {
    this.searchTermUnits = '';
    this.filteredUnits = [...this.units];
    this.applySort();
  }

  getSortArrow(column: string): string {
    if (this.sortColumnUnits !== column) return '↕';
    return this.sortDirectionUnits === 'asc' ? '▲' : '▼';
  }

  sortUnits(column: string) {
    if (this.sortColumnUnits === column) {
      this.sortDirectionUnits = this.sortDirectionUnits === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumnUnits = column;
      this.sortDirectionUnits = 'asc';
    }
    this.applySort();
  }

  private applySort() {
    if (!this.sortColumnUnits) return;
    
    this.filteredUnits.sort((a, b) => {
      const valA = a[this.sortColumnUnits as keyof Unit];
      const valB = b[this.sortColumnUnits as keyof Unit];
      if (valA < valB) return this.sortDirectionUnits === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirectionUnits === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // CRUD операции
  openAddUnitForm() {
    this.showAddUnitForm = true;
    if (this.editingUnit) {
      this.newUnit = {
        unitType: this.editingUnit.unitType,
        engineType: this.editingUnit.engineType,
        ratedPower: this.editingUnit.ratedPower,
        standartPower: this.editingUnit.standartPower,
        consumptionNorm: this.editingUnit.consumptionNorm
      };
    } else {
      this.resetNewUnit();
    }
  }

  closeAddUnitForm() {
    this.showAddUnitForm = false;
    this.editingUnit = null;
    this.resetNewUnit();
    this.uMsg = '';
  }

  private resetNewUnit() {
    this.newUnit = {
      unitType: '',
      engineType: '',
      ratedPower: 0,
      standartPower: 0,
      consumptionNorm: 0
    };
  }

  addUnit() {
    this._units.addUnit({ ...this.newUnit }).subscribe({
      next: (status) => {
        if (status === 201) {
          this.uMsg = "Success";
          this.closeAddUnitForm();
          this.loadUnits();
        } else if (status === 401) {
          this.navigateToLogin.emit();
        } else if (status === 409) {
          this.uMsg = 'Паспорт электроагрегата с таким названием уже существует';
        } else {
          this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: () => {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  deleteUnit(id: number) {
    this._units.deleteUnit(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.uMsg = "Успешно";
          this.loadUnits();
        } else if (status === 401) {
          this.navigateToLogin.emit();
        } else {
          this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: () => {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  editUnit() {
    if (this.editingUnit) {
      this._units.editUnit(this.editingUnit.id, { ...this.newUnit }).subscribe({
        next: (status) => {
          if (status === 200) {
            this.uMsg = "Успешно";
            this.closeAddUnitForm();
            this.loadUnits();
          } else if (status === 401) {
            this.navigateToLogin.emit();
          } else if (status === 409) {
            this.uMsg = 'Паспорт электроагрегата с таким названием уже существует';
          } else {
            this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
          }
        },
        error: () => {
          this.uMsg = "Ошибка. Попробуйте ещё раз.";
        }
      });
    }
  }

  private loadUnits() {
    this._units.getUnits.subscribe({
      next: (result) => {
        if (typeof result !== 'number') {
          this.units = result;
          this.unitsChange.emit(this.units);
          this.filterUnits();
        }
      }
    });
  }

  // Управление модальным окном подтверждения
  openDeleteConfirmation(item: any, callback: Function) {
    this.itemToDelete = item;
    this.deleteCallback = callback;
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation() {
    this.showDeleteConfirmation = false;
    this.itemToDelete = null;
    this.deleteCallback = null;
  }

  confirmDelete() {
    if (this.deleteCallback && this.itemToDelete) {
      this.deleteCallback(this.itemToDelete.id);
    }
    this.closeDeleteConfirmation();
  }

  // Закрытие таблицы
  closeTable() {
    this.close.emit();
  }
}