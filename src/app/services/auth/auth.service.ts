import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { SRV_URL } from '../../config';
import { Md5 } from 'ts-md5';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${SRV_URL}/api`;

  constructor(private _http: HttpClient) { }

  public login(info: { login: string, password: string }): Observable<number> {
    info.password = Md5.hashStr(info.password) as string;

    return this._http.post<any>(`${this.apiUrl}/auth/`, info, { observe: 'response' })
      .pipe(
        map(res => {
          if (res.status == 200) {
            localStorage.setItem("token", res.body.token);
          }
          return res.status;
        }),
        catchError((error: HttpErrorResponse) => {
          return of(error.status); // Упрощенная обработка ошибок
        })
      );
  }
}