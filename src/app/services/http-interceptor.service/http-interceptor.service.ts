import { HttpInterceptorFn } from '@angular/common/http';
import { SRV_URL } from '../../config';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;
  
  const publicUrls = ['/api/Account/login', '/api/Account/updatePassword'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
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
  
  return next(request);
};