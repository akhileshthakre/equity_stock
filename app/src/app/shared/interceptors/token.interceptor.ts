import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, filter, finalize, of, switchMap, take, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { SpinnerService } from '../spinner/spinner.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  // constructor(private _route: Router) { }

  // intercept(
  //   req: HttpRequest<any>,
  //   next: HttpHandler
  // ): Observable<HttpEvent<any>> {
  //   const token = localStorage.getItem('token'); // your auth token
  //   if (token) { // your authorized  logic
  //     req = req.clone({
  //       setHeaders: {
  //         Authorization: `Bearer ${token}`
  //       }
  //     });
  //   } else {
  //     localStorage.clear()
  //     this._route.navigate(['/auth/login'])
  //     req = req.clone({})
  //   }

  //   return next.handle(req);
  // }


  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject(null);

  constructor(private router: Router) { }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(this.addAuthToken(request))
      .pipe(
        catchError((requestError: HttpErrorResponse) => {
          if (requestError && requestError.error === 401) {
            if (this.refreshTokenInProgress) {

              return this.refreshTokenSubject.pipe(
                filter((result: any) => result),
                take(1),
                switchMap(() => next.handle(this.addAuthToken(request)))
              );
            } else {

              this.refreshTokenInProgress = true;
              this.refreshTokenSubject.next(null);
              return of(null).pipe(
                switchMap((token: any) => {
                  this.refreshTokenSubject.next(token);
                  return next.handle(this.addAuthToken(request));
                }),
                finalize(() => (this.refreshTokenInProgress = false))
              );
            }
          }
          if (requestError.status < 500) {
            return throwError(() => new Error(requestError.message));
          }

          if (requestError && requestError.status === 500) {
            return throwError(() => new Error(requestError.message));
          } else {
            return throwError(() => new Error(requestError.message));
          }

        }));
  }



  addAuthToken(request: HttpRequest<any>) {
    const token = localStorage.getItem('token');
    if (!token) {
      return request;
    }

    return request.clone({ 
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

}
