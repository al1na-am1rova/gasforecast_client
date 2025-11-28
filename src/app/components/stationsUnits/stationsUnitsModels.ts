export interface Station {
  id: number;
  name: string;
  activeUnitsCount: number;
  unitType: string;
  launchDate: string;
}

export interface Unit {
  id: number;
  unitType: string;
  engineType: string;
  ratedPower: number;
  standartPower: number;
  consumptionNorm: number;
}