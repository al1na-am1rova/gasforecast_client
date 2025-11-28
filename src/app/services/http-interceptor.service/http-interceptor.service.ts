import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { SRV_URL } from '../../config';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import {Inject} from '@angular/core'

// Если нужен Router, передаем его через фабрику или импортируем глобально
const router = Inject(Router);

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;

  if (req.url.includes('Electric')) {
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }
  }

  const request = req.clone({
    headers,
    url: `${SRV_URL}${req.url}`,
  });

  return next(request).pipe(
    catchError((error: any) => {
      // Если сервер вернул 401 — токен просрочен
      if (error.status === 401) {
        localStorage.removeItem('token'); // очищаем токен
        router.navigate(['/login']);      // редирект на страницу авторизации
      }
      return throwError(() => error);
    })
  );
};
