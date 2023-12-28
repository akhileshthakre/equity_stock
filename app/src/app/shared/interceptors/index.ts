import { HTTP_INTERCEPTORS } from "@angular/common/http"; 
import { HttpErrorInterceptor } from "./http-error.interceptor";
import { HttpResponseInterceptor } from "./http-response.interceptor";
import { TokenInterceptor } from "./token.interceptor";

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    {
        provide: HTTP_INTERCEPTORS,
        useClass: HttpErrorInterceptor,
        multi: true
    },
    {
        provide: HTTP_INTERCEPTORS,
        useClass:HttpResponseInterceptor,
        multi: true
    }
]
