import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Station, Unit} from './stationsModels';
import { StationsService } from '../../services/stations.service/stations.service';
import { UnitsService } from '../../services/units.service/units.service';
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { Calculator } from '../calculator/calculator';
import { UnitsPassports } from '../units-passports/units-passports';

@Component({
  selector: 'app-stations&units',
  templateUrl: './stations.html',
  styleUrls: ['./stations.css'],
  imports: [
    CommonModule,
    FormsModule,
    Calculator,
    NgIf,
    UnitsPassports
  ],
  standalone: true
})
export class Stations {
  constructor(
    private router: Router,
    private _stations: StationsService,
    private _units: UnitsService
  ) {}

  /* Переменные для станций */
  selectedStation: Station | null = null;
  stMsg: string = '';
  isPanelCollapsed = false;
  stations: Station[] = [];
  showAddStationForm = false;
  selectedStationId: number = 0;
  isStationEditing: boolean = false;
  searchTermStations: string = '';
  filteredStations: any[] = [];
  newStation = {
    name: '',
    unitType: '',
    launchDate: '',
    activeUnitsCount: 1
  };

  /* Переменные для паспортов электроагрегатов */
  units: Unit[] = [];
  showUnitsTable = false;

  showMethodology = false;
  showMethodology2 = false;

  /* Прочие переменные */
  userRole: string | null = null;
  showDeleteConfirmation: boolean = false;
  itemToDelete: any = null;
  deleteCallback: Function | null = null;
  today: string = (new Date()).toISOString().split('T')[0];

  ngOnInit() {
    this.loadStations();
    this.loadUnits();
    this.userRole = sessionStorage.getItem('userRole') || null;
    this.checkAuth();
  }

  checkAuth(): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  /* Функции станций */
  filterStations() {
    if (!this.searchTermStations) {
      this.filteredStations = [...this.stations];
    } else {
      const term = this.searchTermStations.toLowerCase();
      this.filteredStations = this.stations.filter(station =>
        station.name.toLowerCase().includes(term)
      );
    }
  }

  clearSearchStations() {
    this.searchTermStations = '';
    this.filteredStations = [...this.stations];
  }

  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.selectedStationId = station.id;
    this.showUnitsTable = false; // Закрываем таблицу при выборе станции
  }

  public loadStations() {
    this._stations.getStations.subscribe({
      next: (result) => {
        if (typeof result === 'number') {
          this.stMsg = "Ошибка. Попробуйте ещё раз.";
        } else {
          this.stations = result;
          this.filterStations();
        }
      },
      error: () => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
    this.stMsg = '';
  }

  openAddStationForm() {
    this.showAddStationForm = true;
    if (this.isStationEditing && this.selectedStation) {
      this.newStation = {
        name: this.selectedStation.name,
        unitType: this.selectedStation.unitType,
        launchDate: this.selectedStation.launchDate,
        activeUnitsCount: this.selectedStation.activeUnitsCount
      };
    } else {
      this.newStation = {
        name: '',
        unitType: '',
        launchDate: '',
        activeUnitsCount: 1
      };
    }
  }

  closeAddStationForm() {
    this.showAddStationForm = false;
    this.isStationEditing = false;
    this.newStation = {
      name: '',
      unitType: '',
      launchDate: '',
      activeUnitsCount: 1
    };
    this.stMsg = '';
  }

  public addStation() {
    this._stations.addStation({ ...this.newStation }).subscribe({
      next: (status) => {
        if (status === 201) {
          this.stMsg = "Успешно";
          this.closeAddStationForm();
          this.loadStations();
        } else if (status === 401) {
          this.router.navigate(['/login']);
        } else if (status === 409) {
          this.stMsg = 'ЭСН с таким названием уже существует';
        } else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: () => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  public deleteStation(id: number) {
    this._stations.deleteStation(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Успешно";
          this.loadStations();
          this.selectedStation = null;
        } else if (status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: () => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  public editStation() {
    this._stations.editStation(this.selectedStationId, ({ ...this.newStation })).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Успешно";
          this.closeAddStationForm();
          this.loadStations();
        } else if (status === 401) {
          this.router.navigate(['/login']);
        } else if (status === 409) {
          this.stMsg = 'ЭСН с таким названием уже существует';
        } else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: () => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  /* Функции паспортов электроагрегатов */
  public loadUnits() {
    this._units.getUnits.subscribe({
      next: (result) => {
        if (typeof result === 'number') {
          this.stMsg = "Ошибка. Попробуйте ещё раз.";
        } else {
          this.units = result;
        }
      },
      error: () => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  onUnitsChange(updatedUnits: Unit[]) {
    this.units = updatedUnits;
  }

  openUnitsTable() {
    this.showUnitsTable = true;
    this.selectedStation = null;
    this.showMethodology = false;
    this.showMethodology2 = false;
  }

  closeUnitsTable() {
    this.showUnitsTable = false;
  }

  openMethodology() {
    this.showMethodology = true;
    this.showUnitsTable = false;
    this.showMethodology2 = false;
  }

  closeMethodology() {
    this.showMethodology = false;
  }

  openMethodology2() {
    this.showMethodology = false;
    this.showUnitsTable = false;
    this.showMethodology2 = true;
  }

  closeMethodology2() {
    this.showMethodology2 = false;
  }

  onNavigateToLogin() {
    this.router.navigate(['/login']);
  }

  // Открытие модального окна подтверждения удаления
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
}