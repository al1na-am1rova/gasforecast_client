import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `/api`;

  constructor(private http: HttpClient) { }

  public login(info: { username: string, password: string }): Observable<number> {
    const loginData = {
      username: info.username,
      password: info.password
      };

    return this.http.post<any>(`${this.apiUrl}/Account/login`, loginData, { observe: 'response' })
      .pipe(
        map(res => {
          if (res.status === 200) {
            const token = res.body.accessToken;
            /*localStorage.setItem("token", token);*/
            sessionStorage.setItem("token", token);
            const role = res.body.role;
            sessionStorage.setItem("userRole", role);
            const username = res.body.username;
            sessionStorage.setItem("userName", username);
          }
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status);
        })
      );
  }
}