import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map} from 'rxjs/operators'; 

@Injectable()
export class HttpResponseInterceptor implements HttpInterceptor {
  constructor( ) {}
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      filter(event => event instanceof HttpResponse),
      map( response => { 
        return response;
      })
    )
  }
}
