import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service/auth.service';
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: 'login.html',
  styleUrls: ['login.css'],
  standalone: true,
  imports: [CommonModule,FormsModule]
})
export class Login {
  loginData = {
    username: '',
    password: ''
  };

  msg = ''; // для отображения сообщений
  submitted = false; // флаг нажатия кнопки

  constructor(private router: Router, private auth: AuthService) {}

  public onLogin() {
    this.submitted = true;

    if (!this.loginData.username || !this.loginData.password) {
      this.msg = 'Пожалуйста, заполните все поля';
      return;
    }

    this.msg = 'Загрузка...';

    this.auth.login({ ...this.loginData }).subscribe({
      next: (status) => {
        if (status === 200) {
          this.msg = "Успешно";
          this.router.navigate(['/stationsUnits']);
        } else if (status === 401) {
          this.msg = "Неправильный логин или пароль";
        } else if (status === 0) {
          this.msg = "Сервер не отвечает";
        } else {
          this.msg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.msg = "Ошибка. Попробуйте еще раз.";
      }
    });
  }
}
