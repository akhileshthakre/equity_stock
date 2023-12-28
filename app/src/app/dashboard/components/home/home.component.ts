import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [MessageService],
})
export class HomeComponent implements OnInit {
    productsHeaders: string[] = ['Date', 'Close', 'High', 'Low', 'Open']
    productsHeadersMapping: string[] = ['period', 'price', 'high', 'low', 'open']
    testHeaders: string[] = ['Fall in stock', 'Limit level', 'Holding Day']
    testHeadersMapping: string[] = ['fallInStock', 'limitLevel', 'hldDay']
    opHeaders: string[] = ['Stock name ', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Days', 'Total Sum', 'Avg Gain', 'Win %']
    opHeadersMapping: string[] = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent']
    pageNumber: number = 0
    data: any;
    showOutPutTable: boolean = false
    options: any;
    uploadedFiles: any[] = [];
    uploadedTestValues: any[] = [];
    products: any[] = []
    testList: any[] = []
    outputList: any[] = []
    backTestForm: FormGroup = this.formBuilder.group({
        slossPercent: [],
        tgPercent: [],
        tsPercent: [],
    })

    constructor(private formBuilder: FormBuilder, private messageService: MessageService, private _stockService: StocksApiService, private spinnerService: SpinnerService) { }

    ngOnInit() {
        this.getStocksFile();
        this.getTestValuesFile()
    }

    get slossPercentControl() {
        return this.backTestForm.get('slossPercent')
    }
    get tgPercentControl() {
        return this.backTestForm.get('tgPercent')
    }
    get tsPercentControl() {
        return this.backTestForm.get('tsPercent')
    }

    onUpload(event: any, fileUpload: any) {
        this.spinnerService.showSpinner(true)
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        }
        this.products = []
        this._stockService.deleteAllStockList().pipe(switchMap((val) =>
            this._stockService.uploadStockXlsxFile(this.uploadedFiles)
        )).pipe(switchMap(val => this._stockService.getAllStockInfo()))
            .subscribe({
                next: (res: any) => {
                    this.spinnerService.showSpinner(false)
                    if (res) {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
                        this.products = res.data
                        this.formatProducts()
                        while (this.uploadedFiles.length) {
                            this.uploadedFiles.pop();
                        }
                        fileUpload.clear()
                        this.outputList = []
                        this.showOutPutTable = true
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' })
                    }
                },
                error: (err: any) => {
                    this.spinnerService.showSpinner(false)
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
                    fileUpload.clear()
                }
            })
    }

    onUploadTestValues(event: any, fileUploadForTestValues: any) {
        this.spinnerService.showSpinner(true)
        for (let file of event.files) {
            this.uploadedTestValues.push(file);
        }
        this.testList = []
        this._stockService.deleteAllTestList().pipe(switchMap(() => this._stockService.uploadTestValuesXlsxFile(this.uploadedTestValues))).pipe(switchMap(val => this._stockService.getAllTestValuesInfo())).subscribe({
            next: (res: any) => {
                this.spinnerService.showSpinner(false)
                this.testList = res.data
                this.formatTestValues();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
                while (this.uploadedTestValues.length) {
                    this.uploadedTestValues.pop();
                }
                fileUploadForTestValues.clear()
                this.outputList = []
                this.showOutPutTable = true
            },
            error: (err: any) => {
                this.spinnerService.showSpinner(false)
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
            }
        })
    }
    formatProducts() {
        this.products.map(val => {
            delete val.id;
            delete val.name;
            delete val.createdAt;
            delete val.updatedAt;

        })
    }

    getStocksFile() {
        this.spinnerService.showSpinner(true)
        this._stockService.getAllStockInfo().subscribe({
            next: (res) => {
                this.products = res.data
                this.formatProducts()
                this.spinnerService.showSpinner(false)
            },
            error: (err: any) => {
                this.spinnerService.showSpinner(false)
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
            }
        })
    }
    getTestValuesFile() {
        this.spinnerService.showSpinner(true)
        this._stockService.getAllTestValuesInfo().subscribe({
            next: (res) => {
                this.spinnerService.showSpinner(false)
                this.testList = res.data
                this.formatTestValues();
            },
            error: (err: any) => {
                this.spinnerService.showSpinner(false)
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
            }
        })
    }
    formatTestValues() {
        this.testList.map((val: any) => {
            delete val.id;
            delete val.createdAt;
            delete val.updatedAt;
            val.fallInStock = Number(val.fallInStock).toFixed(2) + " %";
            val.limitLevel = Number(val.limitLevel).toFixed(2) + " %   ";
            val.hldDay = Number(val.hldDay)
        })
    }

    exceldownload(type: number) {
        this.spinnerService.showSpinner(true)
        switch (type) {
            case 1:
                this.exportToExcl(type, 'stocks.xlsx', this.products, this.productsHeaders, this.productsHeadersMapping)
                break;
            case 2:
                this.exportToExcl(type, 'test_value.xlsx', this.testList, this.testHeaders, this.testHeadersMapping
                )
                break;
            default:
                break;
        }
    }

    exportToExcl(type: number, fileName: string, data: any, headers: string[], mappingHeaders: string[]) {
        // const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(itemList, { header: headers });
        // const wb: XLSX.WorkBook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        // XLSX.writeFile(wb, fileName);

        const mappedData = data.map((item: any) => {
            const mappedItem: any = {};
            mappingHeaders.forEach((fieldMap, index) => {
                mappedItem[headers[index]] = item[fieldMap];
            });
            return mappedItem;
        });

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        XLSX.writeFile(workbook, `${fileName}`);

        this.spinnerService.showSpinner(false)
    }

    downloadInExcl() {
        const obj: any = {
            "downloadAll": true
        }
        if (this.slossPercentControl?.value) obj['slossPercent'] = this.slossPercentControl?.value
        if (this.tgPercentControl?.value) obj['tgPercent'] = this.tgPercentControl?.value
        if (this.tsPercentControl?.value) obj['tsPercent'] = this.tsPercentControl?.value
        this.calOutPut(obj, 3)
    }


    startBackTest(type?: number) {
        this.spinnerService.showSpinner(true)
        if (type) this.pageNumber = 1;
        const obj: any = {
            page: this.pageNumber,
        }
        if (this.slossPercentControl?.value) obj['slossPercent'] = this.slossPercentControl?.value
        if (this.tgPercentControl?.value) obj['tgPercent'] = this.tgPercentControl?.value
        if (this.tsPercentControl?.value) obj['tsPercent'] = this.tsPercentControl?.value
        this.calOutPut(obj)
    }

    calOutPut(obj: any, type?: number) {
        this.spinnerService.showSpinner(true)
        this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
            this.spinnerService.showSpinner(false)
            this.backTestForm.reset()
            if (resp) {
                this.outputList = resp.data
                this.formatOPList()
                if (type == 3) this.exportToExcl(type, 'out_put.xlsx', resp.data, this.opHeaders, this.opHeadersMapping)
                this.showOutPutTable = true

                while (this.uploadedTestValues.length) {
                    this.uploadedTestValues.pop();
                }
                while (this.uploadedFiles.length) {
                    this.uploadedFiles.pop();
                }
                this.testList = []
                this.products = []

            } else {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' });
            }
        }, (err: any) => {
            this.spinnerService.showSpinner(false)
            this.backTestForm.reset()
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' });
        })
    }
    formatOPList() {
        this.outputList.map((item) => {
            delete item.numberOfUpMoves;
            delete item.numberOfDownMoves;
            item.fallInStock = Number(item.fallInStock).toFixed(2) + " %";
            item.limitLevel = Number(item.limitLevel).toFixed(2) + " %   ";
            item.hldDay = Number(item.hldDay);
            item.totalRetSum = Number(item.totalRetSum).toFixed(2) + " %   ";
            item.avgGain = Number(item.avgGain).toFixed(2) + " %   ";
            item.winPercent = Number(item.winPercent).toFixed(2) + " %   ";
        });
    }
    prevPage() {
        if (this.pageNumber > 1) {
            --this.pageNumber;
            this.startBackTest()
        }
    }
    nextPage() {
        if (this.pageNumber > -1) {
            ++this.pageNumber;
            this.startBackTest()
        }
    }
}
