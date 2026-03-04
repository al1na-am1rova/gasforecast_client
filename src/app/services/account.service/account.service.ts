import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { User } from '../../components/admin-page/userModel';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `/api`;
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  // Логин с сохранением токенов
  public login(info: { username: string, password: string }): Observable<number> {
    const loginData = {
      username: info.username,
      password: info.password
    };

    return this.http.post<any>(`${this.apiUrl}/Account/login`, loginData, { observe: 'response' })
      .pipe(
        tap(res => {
          if (res.status === 200 && res.body) {
            // Сохраняем access token
            if (res.body.accessToken) {
              sessionStorage.setItem('token', res.body.accessToken);
            }
            // Сохраняем refresh token если есть
            if (res.body.refreshToken) {
              sessionStorage.setItem('refreshToken', res.body.refreshToken);
            }
            // Сохраняем роль
            if (res.body.role) {
              sessionStorage.setItem('userRole', res.body.role);
            }
            // Сохраняем имя пользователя
            if (res.body.username) {
              sessionStorage.setItem('userName', res.body.username);
            }
          }
        }),
        map(res => res.status),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);
          return of(error.status);
        })
      );
  }

  // Обновление токена
  public refreshToken(): Observable<any> {
    const refreshToken = sessionStorage.getItem('refreshToken');
    const currentToken = sessionStorage.getItem('token');

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // Предотвращаем множественные запросы на обновление
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    const refreshData = {
      accessToken: currentToken,
      refreshToken: refreshToken
    };

    return this.http.post<any>(`${this.apiUrl}/Account/refresh-token`, refreshData, { observe: 'response' })
      .pipe(
        tap(res => {
          if (res.status === 200 && res.body) {
            if (res.body.accessToken) {
              sessionStorage.setItem('token', res.body.accessToken);
            }
            if (res.body.refreshToken) {
              sessionStorage.setItem('refreshToken', res.body.refreshToken);
            }
            this.refreshTokenSubject.next(res.body.accessToken);
          }
          this.refreshTokenInProgress = false;
        }),
        map(res => res.body),
        catchError((error: HttpErrorResponse) => {
          console.error('Refresh token error:', error);
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(null);
          
          // Если refresh token тоже истек, выходим из системы
          if (error.status === 401) {
            this.logout();
          }
          
          return throwError(() => error);
        })
      );
  }

  // Получение списка пользователей
  public getUsers(): Observable<User[] | number> {
    return this.http.get<any>(`${this.apiUrl}/Account/getUsers`, { observe: 'response' })
      .pipe(
        map(res => res.status === 200 ? res.body as User[] : res.status),
        catchError((error: HttpErrorResponse) => {
          console.error('Get users error:', error);
          return of(error.status);
        })
      );
  }

  // Обновление пароля
  public updatePassword(username: string, newPassword: string): Observable<number> {
    const params = new HttpParams()
      .set('userName', username)
      .set('newPassword', newPassword);

    return this.http.put<any>(`${this.apiUrl}/Account/updatePassword`, null, {
      params: params,
      observe: 'response'
    }).pipe(
      map(res => res.status),
      catchError((error: HttpErrorResponse) => {
        console.error('Update password error:', error);
        return of(error.status);
      })
    );
  }

  // Получение времени последней сессии
  public getLastSessionTime(username: string): Observable<number | string> {
    return this.http.get<any>(`${this.apiUrl}/Account/getLastSessionTime/${username}`, { observe: 'response' })
      .pipe(
        map(res => res.status === 200 ? res.body as string : res.status),
        catchError((error: HttpErrorResponse) => {
          console.error('Get last session time error:', error);
          return of(error.status);
        })
      );
  }

  // Регистрация нового пользователя
  public registerUser(registerData: { username: string, password: string, role: string }): Observable<number> {
    return this.http.post<any>(`${this.apiUrl}/Account/register`, registerData, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => {
          console.error('Register user error:', error);
          return of(error.status);
        })
      );
  }

  // Проверка, является ли пароль временным
  public isTemporaryPassword(username: string): Observable<number | boolean> {
    const params = new HttpParams().set('userName', username);
    return this.http.get<any>(`${this.apiUrl}/Account/isTemporaryPassword/`, {
      params: params,
      observe: 'response'
    }).pipe(
      map(res => res.status === 200 ? res.body as boolean : res.status),
      catchError((error: HttpErrorResponse) => {
        console.error('Check temporary password error:', error);
        return of(error.status);
      })
    );
  }

  // Удаление аккаунта
  public deleteAccount(id: number): Observable<number> {
    return this.http.delete<any>(`${this.apiUrl}/Account/delete/${id}`, { observe: 'response' })
      .pipe(
        map(res => res.status),
        catchError((error: HttpErrorResponse) => {
          console.error('Delete account error:', error);
          return of(error.status);
        })
      );
  }

  // Редактирование аккаунта (изменение роли)
  public editAccount(id: number, newRole: string): Observable<number> {
    const params = new HttpParams().set('newRole', newRole);
    return this.http.put<any>(`${this.apiUrl}/Account/changeRole/${id}`, null, {
      params: params,
      observe: 'response'
    }).pipe(
      tap(res => console.log('Edit account response:', res)),
      map(res => res.status),
      catchError((error: HttpErrorResponse) => {
        console.error('Edit account error:', error);
        return of(error.status);
      })
    );
  }

  // Выход из системы
  public logout(): void {
    // Опционально: уведомить сервер о выходе
    const token = sessionStorage.getItem('token');
    if (token) {
      this.http.post(`${this.apiUrl}/Account/logout`, {}, {
        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
      }).subscribe({
        next: () => console.log('Logout successful'),
        error: (err) => console.error('Logout error:', err)
      });
    }

    // Очищаем все данные сессии
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    
    // Перенаправляем на страницу входа
    this.router.navigate(['/login']);
  }

  // Проверка авторизации
  public isAuthenticated(): boolean {
    return !!sessionStorage.getItem('token');
  }

  // Получение роли пользователя
  public getUserRole(): string | null {
    return sessionStorage.getItem('userRole');
  }

  // Получение имени пользователя
  public getUserName(): string | null {
    return sessionStorage.getItem('userName');
  }

  // Проверка, истек ли токен
  public isTokenExpired(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return true;

    try {
      // Декодируем JWT токен (если он в формате JWT)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // время истечения в миллисекундах
      return Date.now() >= exp;
    } catch {
      // Если не JWT, проверяем по времени сохранения
      const loginTime = sessionStorage.getItem('loginTime');
      if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime, 10);
        // Считаем токен истекшим через 24 часа
        return elapsed > 24 * 60 * 60 * 1000;
      }
      return false;
    }
  }

  // Сохранение времени входа
  public setLoginTime(): void {
    sessionStorage.setItem('loginTime', Date.now().toString());
  }
}