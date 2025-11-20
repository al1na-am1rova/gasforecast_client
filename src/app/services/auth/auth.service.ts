import { Injectable } from '@angular/core';
import { SRV_URL } from '../../config';
import { Md5 } from 'ts-md5';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${SRV_URL}/api`;

  constructor(private http: HttpClient) { }

  public login(info: { login: string, password: string }): Observable<number> {
    const loginData = {
      ...info,
      password: Md5.hashStr(info.password) as string
    };

    return this.http.post<any>(`${this.apiUrl}/auth/`, loginData, { observe: 'response' })
      .pipe(
        map(res => {
          if (res.status === 200) {
            localStorage.setItem("token", res.body.token);
          }
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
  }
}