import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service/auth.service';
import {Router} from "@angular/router";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: 'login.html',
  styleUrls: ['login.css'],
  standalone:true,
  imports: [FormsModule]
})
export class Login {
  
  loginData = {
  username: '',
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
          this.goGasforecast();
        } else if (status === 401) {
          this.msg = "Wrong username/password";
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
