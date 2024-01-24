import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { END_POINT_CONST } from '../constants/endpoints.const';
import { catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExecutionApiService {

  constructor(private _http: HttpClient) { }

  handleError(error: Error): any {
    return throwError(error);
  }

  deleteAllExecutionList(): any {
    return this._http.delete<any>(`${environment.BASE_URL}${END_POINT_CONST.EXECUTION.DELETE_EXECUTION_SHEET}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }


  uploadExecutionXlsxFile(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    formData.append("file", payload[0]);
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.EXECUTION.UPLOAD_EXECUTION_SHEET}`, formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  calculateExecution(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.EXECUTION.CALCULATE_EXECUTION}`, payload, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  getAllExecutionInfo() {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.EXECUTION.GET_EXECUTION_SHEET}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
}
