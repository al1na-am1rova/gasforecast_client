import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: 'login.html',
  styleUrls: ['login.css'],
  standalone:true
})
export class Login {
  
  loginData = {
  login: '',
  password: ''
  };
  
  msg = ''; // для отображения сообщений

  constructor(private router: Router , private auth: AuthService){}
  public goGasforecast() {
    this.router.navigate(['/gasforecast']);
  }

  public onLogin() {
    this.msg = 'Loading...'; // сообщение о загрузке
    this.auth.login({ ...this.loginData }).subscribe({
      next: (status) => {
        if (status === 200) {
          this.msg = "Success";
        } else if (status === 401) {
          this.msg = "Wrong login/password";
        } else {
          this.msg = `Something went wrong (${status})`;
        }
      },
      error: (error) => {
        this.msg = "Connection error. Please try again.";
        console.error('Login error:', error);
      }
    });
  }
}
