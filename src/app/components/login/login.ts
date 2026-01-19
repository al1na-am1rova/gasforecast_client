import { Component } from '@angular/core';
import { AccountService } from '../../services/account.service/account.service';
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: 'login.html',
  styleUrls: ['login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Login {
  loginData = {
  username: '',
  password: ''
  };

  newPasswordData = {
    newPassword: '',
    confirmPassword: ''
  };

  msg = '';
  submitted = false;
  firstSession = false;
  isChangingPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordChangeMessage = '';
  isLoading = false;

  constructor(private router: Router, private account: AccountService) {
  }

  getLogin(): string | null{
    console.log(sessionStorage.getItem('userName'));
    return sessionStorage.getItem('userName')
  }

  logOut() {
    sessionStorage.clear();
    this.router.navigate(["/login"]);
  }

  goMainPage() {
    this.router.navigate(["/stationsUnits"]);
  }

  // Метод для проверки временного пароля
  private checkTemporaryPassword(username: string): void {
    this.account.isTemporaryPassword(username).subscribe({
      next: (result: boolean | number) => {
        if (typeof result === 'number') {
          console.error(`Ошибка ${result} при проверке пароля`);
          this.firstSession = false;
          this.continueAfterLogin();
        } else {
          this.firstSession = result;
          console.log(result);
          this.continueAfterLogin();
        }
      },
      error: (error) => {
        console.error('Ошибка проверки пароля:', error);
        this.firstSession = false;
        this.continueAfterLogin();
      }
    });
  }

  // Продолжение после проверки пароля
  private continueAfterLogin(): void {
    if (this.firstSession) {
      sessionStorage.setItem('username', this.loginData.username);
      this.msg = 'Это ваш первый вход. Пожалуйста, смените пароль.';
    } else {
      this.router.navigate(['/stationsUnits']);
    }
  }

  public onLogin(): void {
    this.submitted = true;
    this.isLoading = true;

    if (!this.loginData.username || !this.loginData.password) {
      this.msg = 'Пожалуйста, заполните все поля';
      this.isLoading = false;
      return;
    }

    this.msg = 'Загрузка...';

    this.account.login({ ...this.loginData }).subscribe({
      next: (status: number) => {
        this.isLoading = false;
        
        if (status === 200) {
          this.msg = 'Успешный вход!';
          
          // Проверяем, временный ли пароль
          this.checkTemporaryPassword(this.loginData.username);
          
        } else if (status === 401) {
          this.msg = 'Неправильный логин или пароль';
        } else if (status === 0) {
          this.msg = 'Сервер не отвечает';
        } else {
          this.msg = `Что-то пошло не так. Код ошибки (${status})`;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.msg = 'Ошибка соединения. Попробуйте еще раз.';
        console.error('Login error:', error);
      }
    });
  }

  // Метод для смены пароля (если firstSession = true)
  public updatePassword(): void {
    this.isLoading = true;
    this.msg = 'Смена пароля...';
    
    this.account.updatePassword(this.loginData.username, this.newPasswordData.newPassword).subscribe({
      next: (status: number) => {
        this.isLoading = false;
        
        if (status === 200) {
          this.msg = 'Пароль успешно изменен!';
          this.firstSession = false;
           this.router.navigate(['/stationsUnits']);
          
        } else {
          this.msg = `Ошибка смены пароля (код: ${status})`;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.msg = 'Ошибка соединения при смене пароля';
      }
    });
  }
}