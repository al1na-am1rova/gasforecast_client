import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.html',
  styleUrls: ['login.css']
})
export class Login {
  
  loginData = {
  login: '',
  password: ''
  };
  
  msg = ''; // для отображения сообщений

  constructor(private _auth: AuthService) {}

  public onLogin() {
    this.msg = 'Loading...'; // сообщение о загрузке
    
    this._auth.login({ ...this.loginData }).subscribe({
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