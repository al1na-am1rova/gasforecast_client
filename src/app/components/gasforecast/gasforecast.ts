import { Component } from '@angular/core';

@Component({
  selector: 'app-gasforecast',
  templateUrl: './gasforecast.html',
  styleUrls: ['./gasforecast.css']
})
export class Gasforecast {
  esnExpanded = true;
  aggregate1Expanded = false;
  aggregate2Expanded = false;
  aggregate3Expanded = false;

  toggleEsn() {
    this.esnExpanded = !this.esnExpanded;
  }

  toggleAggregate(aggregateNumber: number) {
    switch (aggregateNumber) {
      case 1:
        this.aggregate1Expanded = !this.aggregate1Expanded;
        break;
      case 2:
        this.aggregate2Expanded = !this.aggregate2Expanded;
        break;
      case 3:
        this.aggregate3Expanded = !this.aggregate3Expanded;
        break;
    }
  }

  selectComponent(componentName: string) {
    // Логика выбора компонента
    console.log('Выбран компонент:', componentName);
  }
}