import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { switchMap } from 'rxjs';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';
import * as XLSX from 'xlsx';

interface UploadEvent {
    // originalEvent: Event;
    files: File[];
}

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
    opHeaders: string[] = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Days', 'Total Sum', 'Avg Gain', 'Win %', '# of years']
    opHeadersMapping: string[] = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears']
    pageNumber: number = 0;
    fileCount: number = 0
    data: any;
    isNewFormula: boolean = false
    isYearlySumEnabled: boolean = false
    showOutPutTable: boolean = false
    options: any;
    uploadedFiles: any[] = [];
    uploadedTestValues: any[] = [];
    products: any[] = []
    stockData: any[] = []
    testList: any[] = []
    outputList: any[] = []
    outputData: any[] = []
    backTestForm: FormGroup = this.formBuilder.group({
        slossPercent: [],
        tgPercent: [],
        tsPercent: [],
    })

    constructor(private formBuilder: FormBuilder, private messageService: MessageService, private _stockService: StocksApiService, private spinnerService: SpinnerService) { }

    ngOnInit() {
        //this.getStocksFile();
        //this.getTestValuesFile()
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

    onUpload(event: UploadEvent, fileUpload: any) {
        this.spinnerService.showSpinner(true)
        // console.log(event)
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        }
        this.products = []
        this._stockService.deleteAllStockList().pipe(switchMap((val) =>
            this._stockService.uploadStockXlsxFile(this.uploadedFiles)
        ))
            //.pipe(switchMap(val => this._stockService.getAllStockInfo()))
            .subscribe({
                next: (res: any) => {
                    this.spinnerService.showSpinner(false)
                    if (res) {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
                        let data = res.data
                        this.fileCount = res.data?.fileCount ?? 0
                        if (data.fileCount > 1) {
                            let files = data.filesName
                            files.forEach((element: string) => {
                                const obj = {
                                    date: new Date(),
                                    name: element
                                }
                                this.stockData.push(obj);
                            });
                        } else {
                            this.getStocksFile();
                            this.stockData = []
                        }
                        this.formatProducts()
                        while (this.uploadedFiles.length) {
                            this.uploadedFiles.pop();
                        }
                        fileUpload.clear()
                        this.outputList = []
                        this.outputData = []
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

    onUploadTestValues(event: UploadEvent, fileUploadForTestValues: any) {
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
            val.fallInStock = Number(val.fallInStock * 100).toFixed(1) + "%";
            val.limitLevel = Number(val.limitLevel * 100).toFixed(2) + "%";
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


        const mappedData = data.map((item: any) => {
            const mappedItem: any = {};
            mappingHeaders.forEach((fieldMap, index) => {
                let value = item[fieldMap];
                if (value) {
                    mappedItem[headers[index]] = value;
                } else {
                    mappedItem[headers[index]] = null;
                }
            });
            return mappedItem;
        });


        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(mappedData);
        const yearlyIndex = []
        for(let i = 9; i<= headers.length; i++) {
            yearlyIndex.push(i)
        }

        const percentageColumns: number[] = [1, 2, 5, 6, 7, ...yearlyIndex];
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

        this.spinnerService.showSpinner(false)
    }
    downloadOPExcl() {
        this.formatOPList();
        this.exportToExcl(1, 'output.xlsx', this.outputList, this.opHeaders, this.opHeadersMapping)
    }

    formatPercentage(val: number) {
        return Number(val / 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
    }

    stockExceldownload(index: number) {
        this.spinnerService.showSpinner(true)
        let stock = this.outputData.find(stock => stock.index == index)
        if (stock) {
            const obj = {
                downloadAll: true,
                stockId: stock.name
            }
            this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
                this.spinnerService.showSpinner(false)
                let list: any[] = [].concat(...resp.data)
                list.map((item: any) => {
                    item.fallInStock = Number(item.fallInStock);
                    item.limitLevel = Number(item.limitLevel);
                    item.hldDay = Number(item.hldDay);
                    item.totalRetSum = Number(item.totalRetSum);
                    item.avgGain = Number(item.avgGain);
                    item.winPercent = Number(item.winPercent);
                    item.numberOfYears = Number(item.numberOfYears)
                });
                this.exportToExcl(1, (stock.name as string) + '.xlsx', list, this.opHeaders, this.opHeadersMapping)
            })
        }
    }

    downloadInExcl() {
        const obj: any = {
            downloadAll: true,
            isNewFormula: this.isNewFormula,
            isYearlySumEnabled: this.isYearlySumEnabled,
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
            isNewFormula: this.isNewFormula
        }
        if (this.slossPercentControl?.value) obj['slossPercent'] = this.slossPercentControl?.value
        if (this.tgPercentControl?.value) obj['tgPercent'] = this.tgPercentControl?.value
        if (this.tsPercentControl?.value) obj['tsPercent'] = this.tsPercentControl?.value
        this.calOutPut(obj)
    }

    calOutPut(obj: any, type?: number) {
        this.outputData = []
        this.outputList = []
        this.spinnerService.showSpinner(true)
        this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
            this.spinnerService.showSpinner(false)
            this.backTestForm.reset()
            if (resp) {
                console.log(resp)
                if (this.fileCount < 2) {
                    this.outputList = [].concat(...resp.data)

                } else {
                    let list = [].concat(...resp.data)
                    const groupedData: any = {};
                    list.forEach((item: any) => {
                        const stockName = item.nameOfStock;
                        if (!groupedData[stockName]) {
                            groupedData[stockName] = [];
                        }
                        groupedData[stockName].push(item);
                    });
                    setTimeout(() => {
                        let index = 0
                        Object.entries(groupedData).forEach(([key, value]) => {
                            (value as Array<any>).map((item: any) => {
                                item.fallInStock = Number(item.fallInStock);
                                item.limitLevel = Number(item.limitLevel);
                                item.hldDay = Number(item.hldDay);
                                item.totalRetSum = Number(item.totalRetSum);
                                item.avgGain = Number(item.avgGain);
                                item.winPercent = Number(item.winPercent);
                                item.numberOfYears = Number(item.numberOfYears)

                            });
                            //console.log(value)
                            let data = {
                                name: key,
                                opData: value,
                                index: ++index
                            }
                            this.outputData.push(data)
                        });
                    }, 0);
                }


                if (type == 3) {
                    if (this.isYearlySumEnabled) {
                        let list = this.formatOPListForYearWise()
                        this.exportToExcl(type, 'out_put.xlsx', list, this.opHeaders, this.opHeadersMapping)
                    } else {
                        this.formatOPList()
                        this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Days', 'Total Sum', 'Avg Gain', 'Win %', '# of years']
                        this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears']
                        this.exportToExcl(type, 'out_put.xlsx', this.outputList, this.opHeaders, this.opHeadersMapping)
                    }
                }

                this.formatDisplayOPList()
                this.showOutPutTable = true
                //this.isNewFormula = false       

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
            item.fallInStock = Number(item.fallInStock);
            item.limitLevel = Number(item.limitLevel);
            item.hldDay = Number(item.hldDay);
            item.totalRetSum = Number(item.totalRetSum);
            item.avgGain = Number(item.avgGain);
            item.winPercent = Number(item.winPercent);
            item.numberOfYears = Number(item.numberOfYears)
        });
    }
    formatOPListForYearWise(): any[] {
        let list: any[] = []

        this.outputList[0].years.forEach((element: any) => {
            this.opHeaders.push(String(" "+element));
            this.opHeadersMapping.push(String(" "+element));
        });
        this.outputList.forEach((item) => {
            const obj: any = {}
            obj['nameOfStock'] = String(item.nameOfStock);
            obj['fallInStock'] = Number(item.fallInStock);
            obj['limitLevel'] = Number(item.limitLevel);
            obj['hldDay'] = Number(item.hldDay);
            obj['totalRetSum'] = Number(item.totalRetSum);
            obj['avgGain'] = Number(item.avgGain);
            obj['winPercent'] = Number(item.winPercent);
            obj['totalDays'] = Number(item?.totalDays);
            obj['numberOfYears'] = Number(item.numberOfYears);
            let number: number = 0;
            let key: any = '';
            let value: any = ''

            while (number <= item.years.length) {
                key = item.years[number]
                value = item.yearlyRetSum[item.years[number]]
                number++;
                obj[" "+key] = Number(value/100 || 0.00)
            }
            list.push(obj);
        });
        return list
    }

    //This function should be display on the screen
    formatDisplayOPList() {
        this.outputList.map((item) => {
            delete item.numberOfUpMoves;
            delete item.numberOfDownMoves;
            item.fallInStock = this.formatPercentage(Number(item.fallInStock * 100));
            item.limitLevel = this.formatPercentage(Number(item.limitLevel * 100));
            item.hldDay = Number(item.hldDay);
            item.totalRetSum = this.formatPercentage(Number(item.totalRetSum * 100));
            item.avgGain = this.formatPercentage(Number(item.avgGain * 100));
            item.winPercent = this.formatPercentage(Number(item.winPercent * 100));
            item.numberOfYears = Number(item.numberOfYears)

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
