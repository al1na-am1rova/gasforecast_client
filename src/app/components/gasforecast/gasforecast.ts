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

  selectedStation: Station | null = null;
  selectedUnit: Unit | null = null;
  isPanelCollapsed = false;
  stMsg: string = '';
  uMsg: string = '';
  stations: Station[] = [];
  units: Unit[] = [];
  userRole: string|null = null;
  showUnitsTable = false;
  showAddStationForm = false;
  showAddUnitForm = false;
  selectedStationId: number = 0;
  isStationEditing: boolean = false;
  editingUnit:Unit|null = null;

  // Методы для управления таблицей
  openUnitsTable() {
    this.showUnitsTable = true;
    this.selectedStation = null;
    this.selectedUnit = null;
  }

  closeUnitsTable() {
    this.showUnitsTable = false;
  }

  newStation = {
    name: '',
    unitType: '',
    launchDate: '',
    activeUnitsCount: 1
  };

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
        this.stMsg = "Connection error. Please try again.";
      } else {
        this.stations = result;
      }
    },
    error: (error) => {
      this.stMsg = "Connection error. Please try again.";
    }
  });
    this.stMsg = '';
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
    this.uMsg = '';
  }

  //методы для формы агрегата
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
        else {
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
  }

  public addStation() {
    this._stations.addStation({ ...this.newStation}).subscribe({
      next: (status) => {
        if (status === 201) {
          this.stMsg = "Success";
          this.closeAddStationForm();
          this.loadStations();
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.stMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Connection error. Please try again.";
      }
    });
  }

  public deleteUnit(id:number){
    this._units.deleteUnit(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.uMsg = "Success";
          this.loadUnits();
          this.selectedUnit = null;
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.uMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Connection error. Please try again.";
      }
    });
  }

   public deleteStation(id:number){
    this._stations.deleteStation(id).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Success";
          this.loadStations();
          this.selectedStation = null;
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.stMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Connection error. Please try again.";
      }
    });
  }

  public editStation(){
    this._stations.editStation(this.selectedStationId, ({ ...this.newStation})).subscribe({
      next: (status) => {
        if (status === 200) {
          this.stMsg = "Success";
          this.closeAddStationForm();
          this.loadStations(); 
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.stMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.stMsg = "Connection error. Please try again.";
      }
    });
  }

  public editUnit(){
  if (this.editingUnit) {
  this._units.editUnit(this.editingUnit.id, { ...this.newUnit}).subscribe({
      next: (status) => {
        if (status === 200) {
          this.uMsg = "Success";
          this.closeAddUnitForm();
          this.loadUnits();
        } 
        else if (status == 401) {
        this.router.navigate(['/login']);
        }
        else {
          this.uMsg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.uMsg = "Connection error. Please try again.";
      }
    });
  }
  else {
    this.uMsg = `Something went wrong`;
  }
}
}