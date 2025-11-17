import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Station, Unit} from './gasforecastModels';

@Component({
  selector: 'app-gasforecast',
  templateUrl: './gasforecast.html',
  styleUrls: ['./gasforecast.css'],
  imports: [CommonModule],
  standalone: true
})
export class Gasforecast{

  stations: Station[] = [
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
  ]

  units: Unit[] = [
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
  ]

  activeTab: string = 'stations';
  selectedStation: Station | null = null;
  selectedUnit: Unit | null = null;

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


  get getStations(): Station[] {
     return this.stations;
  }

  get getUnits(): Unit[] {
     return this.units;
  }

}