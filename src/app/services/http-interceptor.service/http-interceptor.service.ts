import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { SRV_URL } from '../../config';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, Observable } from 'rxjs';
import { AccountService } from '../account.service/account.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AccountService);
  
  let headers = req.headers;
  
  const publicUrls = ['/api/Account/login', '/api/Account/updatePassword', '/api/Account/refresh-token'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  // Добавляем токен только для непубличных URL
  if (!isPublicUrl) {
    const token = sessionStorage.getItem('token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }
  }
  
  const request = req.clone({
    headers,
    url: `${SRV_URL}${req.url}`,
  });
  
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Если ошибка 401 (Unauthorized) и это не запрос на обновление токена
      if (error.status === 401 && !req.url.includes('/api/Account/refresh-token')) {
        return handle401Error(request, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// Обработка ошибки 401
function handle401Error(
  req: any, 
  next: any, 
  authService: AccountService, 
  router: Router
): Observable<any> {
  
  // Пытаемся обновить токен
  return authService.refreshToken().pipe(
    switchMap((response: any) => {
      // Сохраняем новый токен
      if (response && response.token) {
        sessionStorage.setItem('token', response.token);
        
        // Обновляем заголовок запроса с новым токеном
        const newHeaders = req.headers.set('Authorization', `Bearer ${response.token}`);
        const newRequest = req.clone({
          headers: newHeaders
        });
        
        // Повторяем исходный запрос с новым токеном
        return next(newRequest);
      }
      
      // Если нет токена в ответе, пробуем получить из sessionStorage
      const newToken = sessionStorage.getItem('token');
      if (newToken) {
        const newHeaders = req.headers.set('Authorization', `Bearer ${newToken}`);
        const newRequest = req.clone({
          headers: newHeaders
        });
        return next(newRequest);
      }
      
      return throwError(() => new Error('Failed to refresh token'));
    }),
    catchError((refreshError) => {
      console.error('Ошибка обновления токена:', refreshError);
      
      // Очищаем токены и перенаправляем на страницу входа
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('userRole');
      
      router.navigate(['/login']);
      
      return throwError(() => refreshError);
    })
  );
}