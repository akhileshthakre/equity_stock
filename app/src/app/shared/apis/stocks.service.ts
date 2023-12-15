import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { environment } from "src/environments/environment";
import { END_POINT_CONST } from "../constants/endpoints.const";

@Injectable({
  providedIn: 'root'
})
export class StocksApiService {

  constructor(private _http: HttpClient){}
  uploadStockXlsxFile(payload:any){
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    formData.append('file', payload[0]);
    console.log(formData)
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.UPLOAD_FILE}`,formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  getAllStockInfo(){ 
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.GET_ALL_STOCKS}`).pipe(
      map((res: any) => {
        if (res) { 
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }


  handleError(error: Error):any {
    return throwError(error);
  }
}
