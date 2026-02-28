import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service/account.service';
import { User } from  './userModel';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css']
})
export class AdminPage implements OnInit {

  constructor(private router: Router , private account: AccountService) {}
  
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

  // Переменные для модальных окон
  showEditRoleModal = false;
  showDeleteConfirmation = false;
  selectedUserForEdit: User | null = null;
  selectedUserForDelete: User | null = null;
  selectedNewRole: string = '';
  
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
          console.log('Загруженные пользователи:', this.users);
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
          this.loadUsers();
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
    
    if (success) {
      setTimeout(() => {
        this.message = '';
      }, 5000);
    }
  }

  // Метод для открытия модального окна редактирования
  editUser(user: User) {
    console.log('Редактирование пользователя:', user.role);
    this.selectedUserForEdit = user;
    this.selectedNewRole = user.role;
    this.showEditRoleModal = true;
  }

  // Метод для открытия модального окна удаления
  deleteUser(user: User) {
    console.log('Удаление пользователя:', user);
    this.selectedUserForDelete = user;
    this.showDeleteConfirmation = true;
  }

  // Метод для подтверждения изменения роли
  confirmRoleChange() {
    if (this.selectedUserForEdit && this.selectedNewRole !== this.selectedUserForEdit.role) {
      const userId = this.selectedUserForEdit.id; 

      this.account.editAccount(userId, this.selectedNewRole).subscribe({
        next: (status) => {
          if (status === 200) {
            alert('Роль пользователя успешно обновлена');
            // Обновляем роль в массиве users
            const index = this.users.findIndex(u => u.id === userId);
            if (index !== -1) {
              this.users[index].role = this.selectedNewRole;
            }
            this.closeEditModal();
          } else if (status === 401) {
            this.router.navigate(['/login']);
          } else if (status === 404) {
            alert('Пользователь не найден');
            this.closeEditModal();
          } else {
            alert(`Ошибка при обновлении роли. Код: ${status}`);
            this.closeEditModal();
          }
        },
        error: (error) => {
          console.error('Ошибка при обновлении роли:', error);
          alert('Ошибка при обновлении роли. Попробуйте ещё раз.');
          this.closeEditModal();
        }
      });
    } else if (this.selectedUserForEdit && this.selectedNewRole === this.selectedUserForEdit.role) {
      alert('Роль не изменилась');
      this.closeEditModal();
    }
  }

  // Метод для подтверждения удаления
  confirmDelete() {
    if (this.selectedUserForDelete) {
      const userId = this.selectedUserForDelete.id; // Теперь точно знаем, что это id

      this.account.deleteAccount(userId).subscribe({
        next: (status) => {
          if (status === 200) {
            alert('Пользователь успешно удален');
            // Удаляем пользователя из массива
            this.users = this.users.filter(u => u.id !== userId);
            this.closeDeleteConfirmation();
          } else if (status === 401) {
            this.router.navigate(['/login']);
          } else if (status === 404) {
            alert('Пользователь не найден');
            this.closeDeleteConfirmation();
          } else {
            alert(`Ошибка при удалении пользователя. Код: ${status}`);
            this.closeDeleteConfirmation();
          }
        },
        error: (error) => {
          console.error('Ошибка при удалении пользователя:', error);
          alert('Ошибка при удалении пользователя. Попробуйте ещё раз.');
          this.closeDeleteConfirmation();
        }
      });
    }
  }

  // Метод для закрытия модального окна редактирования
  closeEditModal() {
    this.showEditRoleModal = false;
    this.selectedUserForEdit = null;
    this.selectedNewRole = '';
  }

  // Метод для закрытия модального окна удаления
  closeDeleteConfirmation() {
    this.showDeleteConfirmation = false;
    this.selectedUserForDelete = null;
  }
}