import { Component} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {Station, Unit} from './stationsUnitsModels';
import { StationsService} from '../../services/stations.service/stations.service';
import { UnitsService} from '../../services/units.service/units.service';
import {Router} from "@angular/router";
import { FormsModule } from '@angular/forms';
import { Calculator } from '../calculator/calculator';

@Component({
  selector: 'app-stations&units',
  templateUrl: './stationsUnits.html',
  styleUrls: ['./stationsUnits.css'],
   imports: [
    CommonModule, 
    FormsModule,
    Calculator,
    NgIf
  ],
  standalone: true
})
export class StationsUnits {

constructor(private router: Router , private _stations: StationsService, private _units: UnitsService){}

  /*переменные для станций*/
  selectedStation: Station | null = null;
  selectedUnit: Unit | null = null;
  stMsg: string = '';
  isPanelCollapsed = false;
  stations: Station[] = [];
  showAddStationForm = false
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

  /*переменные для паспортов электроагрегатов*/
  uMsg: string = '';
  units: Unit[] = [];
  showAddUnitForm = false;
  showUnitsTable = false;
  editingUnit:Unit|null = null;
  searchTermUnits: string = '';
  filteredUnits: any[] = [];
  sortColumnUnits: string = '';
  sortDirectionUnits: 'asc' | 'desc' = 'asc';
  newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
  };

  /*прочие переменные */
  userRole: string|null = null;
  showDeleteConfirmation: boolean = false;
  itemToDelete: any = null;
  deleteCallback: Function | null = null;
  today: string = (new Date()).toISOString().split('T')[0];

  //isLoading = true;

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

  /*функции станций */
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
    this.searchTermStations= '';
    this.filteredStations = [...this.stations];
  }
  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.selectedStationId = station.id;
    console.log(this.selectedStation);
    this.selectedUnit = null;
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
    error: (error) => {
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
    };}
    else{
    this.newStation = {
      name: '',
      unitType: '',
      launchDate: '',
      activeUnitsCount: 1
    };}
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
    this.stMsg ='';
  }

  public addStation() {
    this._stations.addStation({ ...this.newStation}).subscribe({
      next: (status) => {
        if (status === 201) {
          this.stMsg = "Успешно";
          this.closeAddStationForm();
          this.loadStations();
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else if (status == 409) {
          this.stMsg = 'ЭСН с таким названием уже существует';
        }
        else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

     public deleteStation(id:number){
    this._stations.deleteStation(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Успешно";
          this.loadStations();
          this.selectedStation = null;
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  public editStation(){
    this._stations.editStation(this.selectedStationId, ({ ...this.newStation})).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Успешно";
          this.closeAddStationForm();
          this.loadStations(); 
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else if (status == 409) {
          this.stMsg = 'ЭСН с таким названием уже существует';
        }
        else {
          this.stMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  /*функции паспортов электроагрегатов*/

   filterUnits() {
    if (!this.searchTermUnits) {
      this.filteredUnits = [...this.units];
    } else {
      const term = this.searchTermUnits.toLowerCase();
      this.filteredUnits = this.units.filter(unit =>
        unit.unitType.toLowerCase().includes(term)
      );
    }
  }

  getSortArrow(column: string): string {
  if (this.sortColumnUnits !== column) return '↕';   // нет активной сортировки
  return this.sortDirectionUnits === 'asc' ? '▲' : '▼';
  }

  clearSearchUnits() {
    this.searchTermUnits= '';
    this.filteredUnits = [...this.units];
  }

  sortUnits(column: string) {
  if (this.sortColumnUnits === column) {
    this.sortDirectionUnits = this.sortDirectionUnits === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumnUnits = column;
    this.sortDirectionUnits = 'asc';
  }

  this.filteredUnits.sort((a, b) => {
    const valA = a[column];
    const valB = b[column];
    if (valA < valB) return this.sortDirectionUnits === 'asc' ? -1 : 1;
    if (valA > valB) return this.sortDirectionUnits === 'asc' ? 1 : -1;
    return 0;
  });
  }

  openUnitsTable() {
    this.showUnitsTable = true;
    this.selectedStation = null;
    this.selectedUnit = null;
  }

  closeUnitsTable() {
    this.showUnitsTable = false;
  }
  public loadUnits()  {
    this._units.getUnits.subscribe({
    next: (result) => {
      if (typeof result === 'number') {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      } else {
        this.units = result;
        this.filterUnits();
      }
    },
    error: (error) => {
      this.uMsg = "Ошибка. Попробуйте ещё раз.";
    }
  });
    this.uMsg = '';
  }

  openAddUnitForm() {
    this.showAddUnitForm = true;
    if (this.editingUnit) {
    this.newUnit = {
    unitType: this.editingUnit.unitType,
    engineType: this.editingUnit.engineType,
    ratedPower: this.editingUnit.ratedPower,
    standartPower: this.editingUnit.standartPower,
    consumptionNorm:this.editingUnit.consumptionNorm
    };}
    else {
    this.newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
    };}
  }

  closeAddUnitForm() {
   this.showAddUnitForm = false;
   this.editingUnit = null;
   this.newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
  };
  this.uMsg ='';
  }

  public addUnit() {
    this._units.addUnit({ ...this.newUnit}).subscribe({
      next: (status) => {
        if (status === 201) {
          this.uMsg = "Success";
          this.closeAddUnitForm();
          this.loadUnits();
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else if (status == 409) {
          this.uMsg = 'Паспорт электроагрегата с таким названием уже существует';
        }
        else {
          this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
}

public deleteUnit(id:number){
    this._units.deleteUnit(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.uMsg = "Успешно";
          this.loadUnits();
          this.selectedUnit = null;
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }

  public editUnit(){
  if (this.editingUnit) {
  this._units.editUnit(this.editingUnit.id, { ...this.newUnit}).subscribe({
      next: (status) => {
        if (status === 200) {
          this.uMsg = "Успешно";
          this.closeAddUnitForm();
          this.loadUnits();
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else if (status == 409) {
          this.uMsg = 'Паспорт электроагрегата с таким названием уже существует';
        }
        else {
          this.uMsg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Ошибка. Попробуйте ещё раз.";
      }
    });
  }
  else {
    this.uMsg = `Что-то пошло не так`;
  }
}

// Открытие модального окна с передачей объекта и функции удаления
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