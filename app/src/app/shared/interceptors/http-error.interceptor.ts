import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root'
})
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor( ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler ): Observable<HttpEvent<any>> {

      return next.handle(request)
        .pipe(
          catchError((error: HttpErrorResponse) => { 
            let errorMessage = '';
            if (error.error instanceof ErrorEvent) {
              errorMessage = `Error: ${error.error.message}`;
            } else {
              errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
            localStorage.clear();
            return throwError(errorMessage);
          })
        )
    }
}

