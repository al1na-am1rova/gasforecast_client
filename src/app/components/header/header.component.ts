import { Component } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class Header {

constructor(private router: Router){}

click() {
  if (localStorage.getItem("token")){
    this.router.navigate(['/stationsUnits'])
  }
}
}
