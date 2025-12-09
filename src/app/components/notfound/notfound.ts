import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.html',
  styleUrls: ['./notfound.css']
})
export class Notfound {
  private previousUrl: string = '';

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = event.url;
      }
    });
  }

  goToMainPage(): void {
    const token = sessionStorage.getItem('token');
    
    if (token) {
      this.router.navigate(['/stationsUnits']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goBack(): void {
    if (this.previousUrl && this.previousUrl !== '/login') {
      this.location.back();
    } else {
      this.goToMainPage();
    }
  }
}