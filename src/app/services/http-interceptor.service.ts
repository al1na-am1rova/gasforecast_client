import { HttpInterceptorFn } from '@angular/common/http';
import { SRV_URL } from '../config';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;
  
  if (req.url === "/gasforecast") {
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }
  }
  
  const request = req.clone({
    headers,
    url: `${SRV_URL}${req.url}`,
  });
  
  return next(request);
};