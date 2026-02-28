import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class Header {

constructor(private router: Router){}

click() {
  if (sessionStorage.getItem("token")){
    this.router.navigate(['/stations'])
  }
}

isAlreadySignedIn() {
  return sessionStorage.getItem('userRole');
}

logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  this.router.navigate(["/login"]);
}

goToAdminPage() {
  this.router.navigate(["/adminPage"]);
}
}
