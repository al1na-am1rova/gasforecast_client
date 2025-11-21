import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Station, Unit} from './gasforecastModels';
import { StationsService} from '../../services/stations.service/stations.service';
import { UnitsService} from '../../services/units.service/units.service';
import {Router} from "@angular/router";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gasforecast',
  templateUrl: './gasforecast.html',
  styleUrls: ['./gasforecast.css'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class Gasforecast{

constructor(private router: Router , private _stations: StationsService, private _units: UnitsService){}

ngOnInit() {
  this.loadStations();
  this.loadUnits();
  this.userRole = localStorage.getItem('userRole') || null;
}

ngOnUpdate() {
  this.loadStations();
  this.loadUnits();
}

  /*stations: Station[] = [
    {
      id: 1,
      name: 'ЭСН1',
      activeUnitsCount: 2,
      unitType: 'тип 1',
      launchDate: new Date('2024-01-15')
    },
    {
      id: 2,
      name: 'ЭСН2',
      activeUnitsCount: 3,
      unitType: 'тип 2',
      launchDate: new Date('2020-02-11')
    },
    {
      id: 3,
      name: 'ЭСН3',
      activeUnitsCount: 4,
      unitType: 'тип 3',
      launchDate: new Date('2020-12-11')
    }
  ]*/

  /*units: Unit[] = [
  {
  id: 1,
  unitType: 'тип1',
  engineType: 'поршневой',
  ratedPower: 1,
  standartPower: 1,
  consumptionNorm: 1,
  },
  {
  id: 2,
  unitType: 'тип2',
  engineType: 'газотурбинный',
  ratedPower: 2,
  standartPower: 2,
  consumptionNorm: 2,
  },
  ]*/

  activeTab: string = 'stations';
  selectedStation: Station | null = null;
  selectedUnit: Unit | null = null;
  isPanelCollapsed = false;
  stMsg: string = '';
  uMsg: string = '';
  stations: Station[] = [];
  units: Unit[] = [];
  userRole: string|null = null;

  showAddStationForm = false;
  newStation = {
    name: '',
    unitType: '',
    launchDate: '',
    activeUnitsCount: 1
  };

  showAddUnitForm = false;
  newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
  };

  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.selectedStation = null;
    this.selectedUnit = null;

  }

  selectStation(station: Station) {
    this.selectedStation = station;
    this.selectedUnit = null;
  }

  selectUnit(unit: Unit) {
    this.selectedUnit = unit;
    this.selectedStation = null;
  }

  public loadStations() {
  this._stations.getStations.subscribe({
    next: (result) => {
      if (typeof result === 'number') {
        this.stMsg = "Connection error. Please try again.";
      } else {
        this.stations = result;
      }
    },
    error: (error) => {
      this.stMsg = "Connection error. Please try again.";
    }
  });
  }

   public loadUnits()  {
    this._units.getUnits.subscribe({
    next: (result) => {
      if (typeof result === 'number') {
        this.uMsg = "Connection error. Please try again.";
      } else {
        this.units = result;
      }
    },
    error: (error) => {
      this.uMsg = "Connection error. Please try again.";
    }
  });
  }

  //методы для формы агрегата
  openAddUnitForm() {
    this.showAddUnitForm = true;
    // Сброс формы
    this.newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
  };
  }

  closeAddUnitForm() {
   this.showAddUnitForm = false;
    this.newUnit = {
    unitType: '',
    engineType: '',
    ratedPower: 0,
    standartPower:0,
    consumptionNorm:0
  };
  }

  private isUnitFormValid(): boolean {
    return !!this.newUnit.unitType && 
           !!this.newUnit.engineType && 
           !!this.newUnit.ratedPower && 
           !!this.newUnit.standartPower &&
           !!this.newUnit.consumptionNorm;
  }

  public addUnit() {
    this._units.addUnit({ ...this.newUnit}).subscribe({
      next: (status) => {
        if (status === 201) {
          this.uMsg = "Success";
          this.closeAddUnitForm();
          this.loadUnits();
        } else {
          this.uMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Connection error. Please try again.";
      }
    });
}

// Новые методы для формы
  openAddStationForm() {
    this.showAddStationForm = true;
    // Сброс формы
    this.newStation = {
      name: '',
      unitType: '',
      launchDate: '',
      activeUnitsCount: 1
    };
  }

  closeAddStationForm() {
    this.showAddStationForm = false;
    this.newStation = {
      name: '',
      unitType: '',
      launchDate: '',
      activeUnitsCount: 1
    };
  }

  private isStationFormValid(): boolean {
    return !!this.newStation.name && 
           !!this.newStation.unitType && 
           !!this.newStation.activeUnitsCount && 
           !!this.newStation.launchDate;
  }

  public addStation() {
    this._stations.addStation({ ...this.newStation}).subscribe({
      next: (status) => {
        if (status === 201) {
          this.stMsg = "Success";
          this.closeAddStationForm();
          this.loadStations();
        } else {
          this.stMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Connection error. Please try again.";
      }
    });
}
}