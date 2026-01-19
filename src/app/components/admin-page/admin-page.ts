import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service/account.service';
import {User} from  './userModel';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css']
})
export class AdminPage implements OnInit {

  constructor(private router: Router , private account: AccountService){}
  
  // Данные
  users: User[] = [];
  showAddForm: boolean = false;
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  message: string = '';
  isSuccess: boolean = false;
  generatedPassword: string = '';
  
  // Новая модель пользователя
  newUser = {
    username: '',
    password: '',
    role: 'user'
  };
  
  ngOnInit(): void {
    this.checkAuth();
    this.loadUsers();
  }
  
  checkAuth(): void {
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!token) {
      this.router.navigate(['/login']);
    } else if (userRole !== 'admin') {
      this.router.navigate(['/stationsUnits']);
    }
  }
  
  loadUsers(): void {
    this.account.getUsers().subscribe({
      next: (result: User[] | number) => {
        if (typeof result === 'number') {
          this.showMessage(`Ошибка ${result}. Попробуйте ещё раз.`, false);
          this.users = [];
        } else {
          this.users = result;
        }
      },
      error: (error) => {
        this.showMessage('Ошибка загрузки пользователей', false);
        this.users = [];
      }
    });
  }
  
  // Создание пользователя
  createUser(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.message = '';
    
    this.account.registerUser(this.newUser).subscribe({
      next: (response: any) => {
        if (response === 200 || response.status === 200) {
          this.showMessage('Пользователь успешно создан!', true);
          this.resetForm();
          this.loadUsers(); // Обновляем список
          this.showAddForm = false;
        } else {
          this.showMessage('Ошибка создания пользователя', false);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        let errorMsg = 'Ошибка сервера';
        
        if (error.status === 409) {
          errorMsg = 'Пользователь с таким именем уже существует';
        } else if (error.status === 400) {
          errorMsg = 'Некорректные данные';
        }
        
        this.showMessage(errorMsg, false);
        this.isSubmitting = false;
      }
    });
  }
  
  // Генерация пароля
  generatePassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    this.newUser.password = password;
    this.generatedPassword = password;
  }
  
  // Показать/скрыть пароль
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  // Отмена создания
  cancelCreation(): void {
    this.showAddForm = false;
    this.resetForm();
    this.message = '';
  }
  
  // Сброс формы
  resetForm(): void {
    this.newUser = {
      username: '',
      password: '',
      role: 'User'
    };
    this.showPassword = false;
    this.generatedPassword = '';
  }
  
  // Показать сообщение
  showMessage(text: string, success: boolean): void {
    this.message = text;
    this.isSuccess = success;
    
    // Автоматическое скрытие через 5 секунд
    if (success) {
      setTimeout(() => {
        this.message = '';
      }, 5000);
    }
  }
}