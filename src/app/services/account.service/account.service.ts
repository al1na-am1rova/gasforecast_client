import { Injectable } from '@angular/core';
import { Md5 } from 'ts-md5';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {User} from '../../components/admin-page/userModel';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

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

  public getUsers(): Observable<User[] | number> {
  return this.http.get<any>(`${this.apiUrl}/Account/getUsers`, {observe:'response'})
    .pipe(
      map(res => res.status === 200 ? res.body as User[] : res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    );
  }

  public updatePassword(username: string, newPassword: string): Observable<number> {
  const params = new HttpParams()
    .set('userName', username)
    .set('newPassword', newPassword);
  
  return this.http.put<any>(`${this.apiUrl}/Account/updatePassword`, null, {
    params: params,
    observe: 'response'
  }).pipe(
    map(res => res.status),
    catchError((error: HttpErrorResponse) => of(error.status))
  );
}

  public getLastSessionTime(username:string): Observable<number | string> {
    return this.http.get<any>(`${this.apiUrl}/Account/getLastSessionTime/${username}`, {observe:'response'})
    .pipe(
      map(res => res.status === 200 ? res.body as string: res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    )
  }

  public registerUser(registerData: {username:string, password: string, role: string}): Observable <number>{
    return this.http.post<any>(`${this.apiUrl}/Account/register`,registerData, { observe: 'response' })
    .pipe(
      map(res=> res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    )
  }

  public isTemporaryPassword(username:string):Observable<number|boolean>{

    const params = new HttpParams().set('userName', username);
    return this.http.get<any>(`${this.apiUrl}/Account/isTemporaryPassword/`, {params:params, observe:'response'})
    .pipe(
      map(res => res.status === 200 ? res.body as boolean: res.status),
      catchError((error: HttpErrorResponse) => of(error.status))
    )
  }
}