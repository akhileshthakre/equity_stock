import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { ExecutionApiService } from 'src/app/shared/apis/execution-api.service';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';
import * as XLSX from 'xlsx';

interface UploadEvent {
  // originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-execution',
  templateUrl: './execution.component.html',
  styleUrls: ['./execution.component.scss'],
  providers: [MessageService]
})
export class ExecutionComponent implements OnInit {

  @ViewChild('sendPath')
  sendPath!: ElementRef;
  uploadedFiles: any[] = [];
  specifiedFileNames: string[] = [];
  calculateFileNames: string[] = [];
  executionList: any[] = []
  outputData: any[] = []
  uploadedStockFiles: any[] = []
  opHeaders: string[] = ['Stock Name', 'Stock Symbol', 'Weightage', 'Fall In Stock', 'Limit Level', 'Hld Day', 'BP', 'Pos Initiated', 'SLOSS', 'TGT', 'SLHIT', 'TGTHIT', 'hld_day', 'Trade Close', 'SP', 'Carry', 'RET', 'ND', 'LP']
  opHeadersMapping: string[] = ['SheetNames', 'stockSymbol', 'weightage', 'fallInStock', 'limitLevel', 'hldDay', 'bp', 'posInitiated', 'sloss', 'tgt', 'slhit', 'tgtHit', 'hld_day', 'tradeClose', 'sp', 'carry', 'ret', 'nd', 'lp']





  constructor(
    private executionApiService: ExecutionApiService,
    private stockService: StocksApiService,
    private spinnerService: SpinnerService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {

  }

  uploadExecutionSheet(event: UploadEvent, fileUpload: any) {
    this.spinnerService.showSpinner(true)
    for (let file of event.files) {
      this.uploadedFiles.push(file);
    }
    this.executionList = []
    this.executionApiService.deleteAllExecutionList().pipe(switchMap((val) =>
      this.executionApiService.uploadExecutionXlsxFile(this.uploadedFiles)
    )).pipe(switchMap(val => this.executionApiService.getAllExecutionInfo())).subscribe((resp: any) => {
      this.spinnerService.showSpinner(false)
      if (resp) {
       // console.log(resp)
        this.executionList = resp.data
        this.executionList.forEach((element: any) => {
          this.specifiedFileNames.push(element.sheetNames + '.xlsx')
        });
        this.formatExecutionList()
        this.outputData = []
        this.calculateFileNames = []
        this.uploadedStockFiles = []
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
        while (this.uploadedFiles.length) {
          this.uploadedFiles.pop();
        }
        fileUpload.clear()
      } else {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' })
      }
    }, (error: Error) => {
      this.spinnerService.showSpinner(false)
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
      fileUpload.clear()
    })
  }

  formatExecutionList() {
    this.executionList.map((item) => {
      item.sheetNames = String(item.sheetNames);
      item.stockSymbol = String(item.stockSymbol);
      item.weightage = Number(item.weightage).toFixed(2) + "%";
      item.fallInStock = Number(item.fallInStock * 100).toFixed(1) + "%";
      item.limitLevel = Number(item.limitLevel * 100).toFixed(2) + "%";
      item.hldDay = Number(item.hldDay);
    });
  }



  uploadFolder(event: any) {
    this.uploadedStockFiles = []
    this.calculateFileNames = []
    this.spinnerService.showSpinner(true)
    const files = event.target.files;
    const fileArray = [...files]
    if (files.length > 0) {
      const xlsxFiles = Array.from(fileArray).filter(file => this.isXLSXFile(file));
      const specifiedFiles = Array.from(xlsxFiles).filter(file => this.specifiedFileNames.includes(file.name));
      //console.log('Uploaded XLSX Files:', specifiedFiles);
      this.sendPath.nativeElement.value = "";
      if (specifiedFiles.length) {
        this.stockService.uploadStockXlsxFile(specifiedFiles).subscribe({
          next: (res: any) => {
            let fileNames: any[] = res.data?.filesName ?? []
            this.outputData = []
            fileNames.forEach(element => {
              this.calculateFileNames.push((element as string).split('.')[0])
            });
            this.spinnerService.showSpinner(false)
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
            this.uploadedStockFiles = specifiedFiles
          }
        })
      } else {
        this.spinnerService.showSpinner(false)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No stocks matched' });
      }
    }
  }

  private isXLSXFile(file: File): boolean {
    const allowedExtensions = ['xlsx', 'xlsm', 'xlsb', 'xls'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return allowedExtensions.includes(extension);
  }



  calculate() {
    this.spinnerService.showSpinner(true)
    this.executionApiService.calculateExecution({ fileNames: this.calculateFileNames }).subscribe({
      next: (response: any) => {
        this.spinnerService.showSpinner(false)
        if (response) {
          this.outputData = response.data
          this.formatDisplayOPData()
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' });
        }
      },
      error: (err: any) => {
        this.spinnerService.showSpinner(false)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' });
      }
    })

  }

  downloadExcel(){
    //this.formatOPData()
    this.stockExceldownload('out_put.xlsx', this.outputData, this.opHeaders, this.opHeadersMapping)
  }

   stockExceldownload(fileName: string, data: any, headers: string[], mappingHeaders: string[]) {
     const mappedData = data.map((item: any) => {
      const mappedItem: any = {};
      mappingHeaders.forEach((fieldMap, index) => {
          let value = item[fieldMap];
          if (value !== undefined && value !== null) {
              mappedItem[headers[index]] = value;
          } else {
              mappedItem[headers[index]] = null;
          }
      });
      return mappedItem;
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(mappedData);

  const percentageColumns: number[] = [3,4]; // Adjust column indices based on excel columns where % used
  percentageColumns.forEach(columnIndex => {
      const range = XLSX.utils.decode_range(worksheet['!ref']!);
      for (let i = range.s.r + 1; i <= range.e.r; i++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: columnIndex });
          const cell = worksheet[cellAddress];
          if (cell && cell.t === 'n') {
              cell.z = '0.00%'; // Setting the percentage format
          }
      }
  });

  // Create a new workbook
  const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
  XLSX.writeFile(workbook, `${fileName}`);
  // this.formatDisplayOPData()

  this.spinnerService.showSpinner(false)


  }


  async formatOPData() {
    this.outputData.map((item) => { 
      delete item.posInitiated;
      item.SheetNames = String(item.SheetNames);
      item.stockSymbol = String(item.stockSymbol);
      item.weightage = Number(item.weightage);
      item.fallInStock = Number(item.fallInStock);
      item.limitLevel = Number(item.limitLevel);
      item.hldDay = Number(item.hldDay);
      item.bp =  Number(item.bp);
      item.sloss =  Number(item.sloss);
      item.tgt =  Number(item.tgt);
      item.slhit =  Number(item.slhit);
      item.tgtHit =  Number(item.tgtHit);
      item.hld_day =  Number(item.hld_day);
      item.tradeClose =  Number(item.tradeClose);
      item.sp =  Number(item.sp);
      item.carry =  Number(item.carry);
      item.ret =  Number(item.ret);
      item.nd =  Number(item.nd);
      item.lp =  (item.lp);
    });
  }

  //This function should be display on the screen
  formatDisplayOPData() {
    this.outputData.map((item) => {
      delete item.posInitiated;
      item.SheetNames = item.SheetNames;
      item.stockSymbol = item.stockSymbol;
      item.weightage = this.formatPercentage(Number(item.weightage * 100));
      item.fallInStock = this.formatPercentage(Number(item.fallInStock * 100));
      item.limitLevel = this.formatPercentage(Number(item.limitLevel * 100));
      item.hldDay = Number(item.hldDay);
      item.bp = Number(item.bp);
      item.sloss = Number(item.sloss);
      item.tgt = Number(item.tgt);
      item.slhit = Number(item.slhit);
      item.tgtHit = Number(item.tgtHit);
      item.hld_day = Number(item.hld_day);
      item.tradeClose = Number(item.tradeClose);
      item.sp = Number(item.sp);
      item.carry = Number(item.carry);
      item.ret = Number(item.ret);
      item.nd = Number(item.nd);
      item.lp = (item.lp);
    });
  }

  formatPercentage(val: number) {
    return Number(val / 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
  }



}
