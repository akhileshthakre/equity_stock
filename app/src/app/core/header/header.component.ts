import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: [MessageService],
})
export class HeaderComponent {
  constructor(private _route: Router, private messageService: MessageService, private stocksApiService: StocksApiService, private spinnerService: SpinnerService) { }
  visible: boolean = false;
  successMessage: string = '';
  failMessage: string = '';
  uploadStocks: any[] = []
  uploadedFiles: any[] = []
  datePipe: DatePipe = new DatePipe("en-US");
  showDialog() {
    this.visible = true;
  }
  onUpload(e: any) { }
  logOut() {
    localStorage.clear()
    this._route.navigate(['/auth/login'])
  }
  goToExecution() {
    this._route.navigate(['/dashboard/execution'])
  }
  goToHome() {
    this._route.navigate(['/dashboard/home'])
  }
  onUploadStocks(event: any, fileUploadForStocks: any) {
    this.uploadedFiles = []
    for (let file of event.files) {
      this.uploadedFiles.push(file);
    }
    this.stocksApiService.uploadStocksSymbols(this.uploadedFiles).subscribe(resp => {
      this.successMessage =''
      fileUploadForStocks.clear()
      if (resp['success'] == true) {
        this.failMessage = ''
        this.getStockSymbols();
      } else {
        this.failMessage = resp?.message
        this.messageService.add({ severity: 'error', summary: 'Error', detail: "failed" });
      }
    }, error => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
      fileUploadForStocks.clear()
    })

  }

  getStockSymbols() {
    this.stocksApiService.getAllStockSymbols().subscribe((resp) => {
      this.successMessage =''
      if (resp['success'] != "false") {
        resp.map((product: any) => {
          delete product.userId;
          product.name = String(product.name);
          product.period = this.datePipe.transform(product.period, 'yyyy-MM-dd');
          product.high = String(Number(product.high).toFixed(2));
          product.low = String(Number(product.low).toFixed(2));
          product.open = String(Number(product.open).toFixed(2));
          product.close = String(Number(product.close).toFixed(2));
        })
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(resp);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, 'stock_symbols.xlsx');
        this.successMessage = "Download successful" 
      } else {
        this.failMessage = resp?.message       
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
      }
    }, error => { 
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
    })

  }
}
