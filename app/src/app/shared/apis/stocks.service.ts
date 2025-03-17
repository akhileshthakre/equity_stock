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

  constructor(private _http: HttpClient) { }

  handleError(error: Error): any {
    return throwError(error);
  }

  getToken(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.GET_TOKEN}`, payload, { params, headers }).pipe(map((res: any) => {
      if (res) {
        return res;
      }
    }), catchError(this.handleError)
    )
  }
  registerUser(payload: any) {
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.REGISTER}`, payload).pipe(map((res: any) => {
      if (res) {
        return res;
      }
    }), catchError(this.handleError)
    )
  }

  checkBulkSearchStockProcessingStatus(): Observable<any> {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.CHECK_PROCESSING_STATUS_SEARCHSTOCK}`);
  }
  downloadBulkSearchResult(): any {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.DOWNLOAD_BULK_SEARCH_RESULT}`, { responseType: 'blob' }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadBulkStockSearch(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    formData.append("file", payload);
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.UPLOAD_BULK_SEARCH_STOCK}`, formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadStockXlsxFile(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    //console.log(payload)
    for (var x = 0; x < payload.length; x++) {
      formData.append("file", payload[x]);
    }
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.UPLOAD_FILE}`, formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  uploadStocksSymbols(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    //console.log(payload)
    for (var x = 0; x < payload.length; x++) {
      formData.append("file", payload[x]);
    }
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS_SYMBOLS.UPLOAD_STOCK_SYMBOLS}`, formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  uploadTestValuesXlsxFile(payload: any) {
    let params = new HttpParams();
    const headers = new HttpHeaders();
    headers.set('Accept', "multipart/form-data");
    const formData = new FormData();
    // for (var x = 0; x < payload.length; x++) {
      formData.append("file", payload[0]);
    // }  
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.UPLOAD_TEST_FILE}`, formData, { params, headers }).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  getAllStockInfo() {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.GET_ALL_STOCKS}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  getAllStockSymbols() {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS_SYMBOLS.GET_STOCK_SYMBOLS}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  getAllTestValuesInfo() {
    return this._http.get(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.GET_ALL_TEST_VALUES}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteAllStockList(): any {
    return this._http.delete<any>(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.DELETE_STOCK_LIST}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  deleteAllTestList() {
    return this._http.delete(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.DELETE_TEST_LIST}`).pipe(
      map((res: any) => {
        if (res) {
          return res;
        }
      }),
      catchError(this.handleError)
    );
  }
  calculateOutPut(payload: any):Observable<any> {
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.CALCULATE}`, payload).pipe(map((res: any) => {
      if (res) {
        return res;
      }
    })
      , catchError(this.handleError)
    )
  }
  searchStock(payload: any):Observable<any> {
    return this._http.post(`${environment.BASE_URL}${END_POINT_CONST.STOCKS.SEARCH_STOCK}`, payload).pipe(map((res: any) => {
      if (res) {
        return res;
      }
    })
      , catchError(this.handleError)
    )
  }


}
