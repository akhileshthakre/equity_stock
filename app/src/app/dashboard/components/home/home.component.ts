import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { elements } from 'chart.js';
import { MessageService } from 'primeng/api';
import { groupBy, switchMap } from 'rxjs';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';
import * as XLSX from 'xlsx';
import { interval } from 'rxjs';
import { takeWhile, finalize } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';


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
    opHeaders: string[] = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years']
    opHeadersMapping: string[] = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears']
    pageNumber: number = 0;
    datePipe: DatePipe = new DatePipe("en-US");
    fileCount: number = 0
    data: any;
    searchStocks: string = ''
    dateRange: any = ''
    isNewFormula: boolean = false
    isYearlySumEnabled: boolean = false
    showOutPutTable: boolean = false
    options: any;
    uploadedFiles: any[] = [];
    stocks: any[] = [];
    uploadedTestValues: any[] = [];
    products: any[] = []
    stockData: any[] = []
    searchStocksData: any[] = []
    testList: any[] = []
    outputList: any[] = []
    outputData: any[] = []
    maxDate: Date = new Date()
    isProcessingBulSearchJob: boolean = false;
    pollingInterval: number = 5000;
    maxPollingAttempts: number = 100;
    downloadReadyforBulkSearch: boolean = false;
    isCheckOnPageLoadDownloadStock: boolean = false;
    pollingSubscription: any;
    backTestForm: FormGroup = this.formBuilder.group({
        // slossPercent: [],
        // tgPercent: [],
        // tsPercent: [],
      
        totalSum: ['', Validators.required],
        avgGain: ['', Validators.required],
        winPercent: ['', Validators.required],
        numNegativeYears: ['', Validators.required],
        maxNegativePercentage: ['', Validators.required],
       
        
    })
    stockSearchForm: FormGroup = this.formBuilder.group({
        searchStocks: ['', Validators.required],
        dateRange: ['', Validators.required]
    })
    isSearchStock: boolean = false;
    showFilters: boolean = false;  // Controls the visibility of the filter form

    apiSources : any[] = [
        { label: 'Yahoo', value: 'yahoo' },
        { label: 'EODHD', value: 'eodhd' }
    ];
    selectedAPISource: any = 'yahoo';  // Default API source
    isYahooAPI: boolean = true;

    toggleFilters() {
        this.showFilters = !this.showFilters;  // Toggle the visibility of the filters
    }

    constructor(private formBuilder: FormBuilder, private messageService: MessageService, private _stockService: StocksApiService, 
        private spinnerService: SpinnerService,
        private router: Router
    ) { }

    ngOnInit() {
        //this.getStocksFile();
        //this.getTestValuesFile()  

        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd && event.url === '/dashboard/home') {
                this.isCheckOnPageLoadDownloadStock = true;
                this.startPollingForProcessingStatus();
            }
        });

        
        this.isProcessingBulSearchJob = true; // ✅ Set processing flag
        this.downloadReadyforBulkSearch = false; // ✅ Disable download button
        this.isCheckOnPageLoadDownloadStock = true;
        this.startPollingForProcessingStatus(); // ✅ Begin polling
    }

    ngOnDestroy() {
        this.isProcessingBulSearchJob = false;
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = null;
        }
    }

   onAPISourceChange(selectedValue: any): void {
        this.isYahooAPI = selectedValue?.value?.value === 'yahoo';
        console.log("Selected API Source:", selectedValue.value.value, selectedValue?.value === 'yahoo');
        this.selectedAPISource = selectedValue?.value?.value
    }

    downloadBulkSearchResult() {
        this.spinnerService.showSpinner(true);
        
        this._stockService.downloadBulkSearchResult().subscribe({
            next: (res: Blob) => {  // Ensure the response type is Blob
                this.spinnerService.showSpinner(false);
    
                if (res) {
                    // Create a URL for the blob
                    const fileURL = window.URL.createObjectURL(res);
    
                    // Create a temporary anchor tag to trigger the download
                    const a = document.createElement('a');
                    a.href = fileURL;
                    a.download = `${new Date().getTime()}_bulk_search_result.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a); // Cleanup
    
                    // Display success message
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Downloaded' });
                }
            },
            error: (err: any) => {
                this.spinnerService.showSpinner(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Download Failed' });
            }
        });
    }
    

    private startPollingForProcessingStatus(): void {
        let attempts = 0;

        this.pollingSubscription = interval(this.pollingInterval)
            .pipe(
                takeWhile(() => this.isProcessingBulSearchJob && attempts < this.maxPollingAttempts), // ✅ Stop after max attempts
                switchMap(() => {
                    console.log(`Polling attempt ${attempts + 1}...`);
                    attempts++;
                    return this._stockService.checkBulkSearchStockProcessingStatus(); // ✅ API call
                }),
                finalize(() => {
                    console.log("Polling stopped after max attempts or completion.");
                })
            )
            .subscribe({
                next: (res: any) => {
                    if (res && res.state === 'completed') { // ✅ Backend response expected as { status: 'completed' }
                        this.isProcessingBulSearchJob = false;
                        this.downloadReadyforBulkSearch = true; // ✅ Enable download button
                        if(!this.isCheckOnPageLoadDownloadStock) {
                            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Processing Completed! File Ready to Download' });
                        }
                        this.isCheckOnPageLoadDownloadStock = false;
                    }
                },
                error: (err: any) => {
                    console.error("Polling error:", err);
                }
            });
    }


    onBasicUploadAuto(event: UploadEvent, fileUpload: any) {
        this.spinnerService.showSpinner(true);
        //isProcessingBulSearchJob
       // console.log("event", event.file)
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        }
        console.log("this.uploadedFiles", this.uploadedFiles)
        this._stockService.uploadBulkStockSearch(this.uploadedFiles[this.uploadedFiles.length-1]).subscribe({
            next: (res: any) => {
                console.log("res------->", res)
                this.spinnerService.showSpinner(false)
                
                if (res) {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
                    this.isProcessingBulSearchJob = true; // ✅ Set processing flag
                    this.downloadReadyforBulkSearch = false; // ✅ Disable download button
                    this.startPollingForProcessingStatus(); // ✅ Begin polling

                    fileUpload.clear(); // ✅ Clear file input
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
                }
            },
            error: (err: any) => {
                this.spinnerService.showSpinner(false)
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
                fileUpload.clear()
            }
        })  


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

    get totalSumControl() {
        return this.backTestForm.get('totalSum')
    }

    get avgGainControl() {
        return this.backTestForm.get('avgGain')
    }

    get winPercentControl() {
        return this.backTestForm.get('winPercent')
    }

    get numNegativeYearsControl() {
        return this.backTestForm.get('numNegativeYears')
    }

    get maxNegativePercentageControl() {
        return this.backTestForm.get('maxNegativePercentage')
    }



    getDateRange(event: any, calendar: any) {
        calendar.overlayVisible = false;
        console.log(this.dateRange)
    }

    onUpload(event: UploadEvent, fileUpload: any) {
        this.spinnerService.showSpinner(true)
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        }
        this.products = []
        this.stockData = []
        this.searchStocksData = []
        this._stockService.deleteAllStockList().pipe(switchMap((val) =>
            this._stockService.uploadStockXlsxFile(this.uploadedFiles)
        )).subscribe({
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
                if (value !== null && value !== undefined) {
                    mappedItem[headers[index]] = value;
                } else {
                    mappedItem[headers[index]] = null;
                }
            });
            return mappedItem;
        });

        console.log("mappedData", mappedData)

        let percentageColumns: number[] = []
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(mappedData);
        const yearlyIndex = []

        if (this.isYearlySumEnabled) {
            for (let i = 15; i <= headers.length; i++) {
                yearlyIndex.push(i)
            }
            percentageColumns = [1, 2, 5, 6, 7, 10, 11, 13, 14, ...yearlyIndex];
        } else {
            console.log("headers", headers.length)
            for (let i = 10; i <= headers.length; i++) {
                
                yearlyIndex.push(i)
            }
            percentageColumns = [1, 2, 5, 6, 7, ...yearlyIndex];
        }

        console.log("percentageColumns", percentageColumns)

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
                stockId: stock.name,
                isYearlySumEnabled: this.isYearlySumEnabled
            }
            this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
                this.spinnerService.showSpinner(false)
                let list: any[] = [].concat(...resp.data)

                if (this.isYearlySumEnabled) {
                    this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', '# Trades / Yr', 'Absolute % / Year', 'Annualized Return %', '# Negative Years', '% Negative Years', 'Max Negative %']
                    this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'tradesPerYear', 'absolutePercentPerYear', 'annualReturn', 'numberOfNegativeYears', 'negativePercentage', 'maxNegativePercentage']
                    let data: any[] = this.formatOPListForYearWise(list)
                    this.exportToExcl(1, data[0].nameOfStock + '_Output.xlsx', data, this.opHeaders, this.opHeadersMapping)
                } else {
                    this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years']
                    this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears']
                    list.map((item: any) => {
                        item.fallInStock = Number(item.fallInStock);
                        item.limitLevel = Number(item.limitLevel);
                        item.hldDay = Number(item.hldDay);
                        item.totalRetSum = Number(item.totalRetSum);
                        item.avgGain = Number(item.avgGain);
                        item.winPercent = Number(item.winPercent);
                        item.numberOfYears = Number(item.numberOfYears)
                    });
                    this.exportToExcl(1, (stock.name as string) + '_Output.xlsx', list, this.opHeaders, this.opHeadersMapping)
                }

            })
        }
    }

    downloadInExclForAll() {
        const obj: any = {
            downloadAll: true,
            isNewFormula: this.isNewFormula,
            isYearlySumEnabled: this.isYearlySumEnabled,
        }
        if (this.slossPercentControl?.value) obj['slossPercent'] = this.slossPercentControl?.value
        if (this.tgPercentControl?.value) obj['tgPercent'] = this.tgPercentControl?.value
        if (this.tsPercentControl?.value) obj['tsPercent'] = this.tsPercentControl?.value
        if (this.totalSumControl?.value) obj['totalSum'] = this.totalSumControl?.value
        if (this.avgGainControl?.value) obj['avgGain'] = this.avgGainControl?.value
        if (this.winPercentControl?.value) obj['winPercent'] = this.winPercentControl?.value
        if (this.numNegativeYearsControl?.value) obj['numNegativeYears'] = this.numNegativeYearsControl?.value
        if (this.maxNegativePercentageControl?.value) obj['maxNegativePercentage'] = this.maxNegativePercentageControl?.value

        this.spinnerService.showSpinner(true)
        this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
            this.spinnerService.showSpinner(false)
            this.backTestForm.reset()
            if (resp) {
                // let list:any = [].concat(...resp.data)  
                resp.data.forEach((list: any) => {
                    if (this.isYearlySumEnabled) {
                        this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', '# Trades / Yr', 'Absolute % / Year', 'Annualized Return %', '# Negative Years', '% Negative Years', 'Max Negative %']
                        this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'tradesPerYear', 'absolutePercentPerYear', 'annualReturn', 'numberOfNegativeYears', 'negativePercentage', 'maxNegativePercentage']
                        let data = this.formatOPListForYearWise(list)
                        this.exportToExcl(1, data[0].nameOfStock + '_Output.xlsx', data, this.opHeaders, this.opHeadersMapping)

                    } else {
                        list.map((item: any) => {
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
                        this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years']
                        this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears']
                        this.exportToExcl(1, list[0].nameOfStock + '_OutPut.xlsx', list, this.opHeaders, this.opHeadersMapping)
                    }


                });


            }
        })
    }

    downloadInExcl() {
        let type: number = 3
        const obj: any = {
            downloadAll: true,
            isNewFormula: this.isNewFormula,
            isYearlySumEnabled: this.isYearlySumEnabled,
        }
        if (this.slossPercentControl?.value) obj['slossPercent'] = this.slossPercentControl?.value
        if (this.tgPercentControl?.value) obj['tgPercent'] = this.tgPercentControl?.value
        if (this.tsPercentControl?.value) obj['tsPercent'] = this.tsPercentControl?.value
        if (this.totalSumControl?.value) obj['totalSum'] = this.totalSumControl?.value
        if (this.avgGainControl?.value) obj['avgGain'] = this.avgGainControl?.value
        if (this.winPercentControl?.value) obj['winPercent'] = this.winPercentControl?.value
        if (this.numNegativeYearsControl?.value) obj['numNegativeYears'] = this.numNegativeYearsControl?.value
        if (this.maxNegativePercentageControl?.value) obj['maxNegativePercentage'] = this.maxNegativePercentageControl?.value

        this.calOutPut(obj, type)
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
        if (this.totalSumControl?.value) obj['totalSum'] = this.totalSumControl?.value
        if (this.avgGainControl?.value) obj['avgGain'] = this.avgGainControl?.value
        if (this.winPercentControl?.value) obj['winPercent'] = this.winPercentControl?.value
        if (this.numNegativeYearsControl?.value) obj['numNegativeYears'] = this.numNegativeYearsControl?.value
        if (this.maxNegativePercentageControl?.value) obj['maxNegativePercentage'] = this.maxNegativePercentageControl?.value

        this.calOutPut(obj)
    }

    calOutPut(obj: any, type?: number) {
        this.outputData = []
        this.outputList = []
        this.spinnerService.showSpinner(true)
        this._stockService.calculateOutPut(obj).subscribe((resp: any) => {
            this.spinnerService.showSpinner(false)
            //this.backTestForm.reset()
            if (!this.isSearchStock) {
                if (resp) {
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
                                    item.numberOfNegativeYears = Number(item.numberOfNegativeYears)
                                    item.maxNegativePercentage = Number(item.maxNegativePercentage);

                                });
                                let data = {
                                    name: key,
                                    opData: value,
                                    index: ++index
                                }
                                this.outputData.push(data)
                            });
                        }, 0);
                    }

                    console.log("this.poutputList", this.outputList)
                   
                    if (type == 3) {
                        if (this.isYearlySumEnabled) {
                            this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', '# Trades / Yr', 'Absolute % / Year', 'Annualized Return %', '# Negative Years', '% Negative Years', 'Max Negative %']
                            this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'tradesPerYear', 'absolutePercentPerYear', 'annualReturn', 'numberOfNegativeYears', 'negativePercentage', 'maxNegativePercentage']
                            let list: any[] = this.formatOPListForYearWise(this.outputList)
                            console.log("this.outputData", list)
                            this.exportToExcl(type, list[0].nameOfStock + '_Output.xlsx', list, this.opHeaders, this.opHeadersMapping)
                        } else {
                            console.log("coming to else",  this.outputList)
                            this.formatOPList()
                            this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', 'No of Negative Years', 'Max Negative %']
                            this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'numberOfNegativeYears', 'maxNegativePercentage']
                            this.exportToExcl(type, this.outputList[0].nameOfStock + '_OutPut.xlsx', this.outputList, this.opHeaders, this.opHeadersMapping)
                        }
                    }

                    this.formatDisplayOPList()
                    this.showOutPutTable = true

                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' });
                }
            } else {
                if (this.stocks.length > 1) {
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
                            let data = {
                                name: key,
                                opData: value,
                                index: ++index
                            }
                            this.outputData.push(data)
                        });
                    }, 0);
                } else {
                    this.outputList = [].concat(...resp.data)
                    console.log("this.poutputList", this.outputList)
                    if (type == 3) {
                        if (this.isYearlySumEnabled) {
                            this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', '# Trades / Yr', 'Absolute % / Year', 'Annualized Return %', '# Negative Years', '% Negative Years', 'Max Negative %']
                            this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'tradesPerYear', 'absolutePercentPerYear', 'annualReturn', 'numberOfNegativeYears', 'negativePercentage', 'maxNegativePercentage']
                            let list: any[] = this.formatOPListForYearWise(this.outputList)
                            this.exportToExcl(type, list[0].nameOfStock + '_Output.xlsx', list, this.opHeaders, this.opHeadersMapping)
                        } else {
                            this.formatOPList()
                            this.opHeaders = ['Stock name', 'Fall in stock', 'Limit level', 'Holding Day', 'Total Trades', 'Total Sum', 'Avg Gain', 'Win %', '# of years', 'No of Negative Years', 'Max Negative %'], 
                            this.opHeadersMapping = ['nameOfStock', 'fallInStock', 'limitLevel', 'hldDay', 'totalDays', 'totalRetSum', 'avgGain', 'winPercent', 'numberOfYears', 'numberOfNegativeYears', 'maxNegativePercentage']
                            this.exportToExcl(type, this.outputList[0].nameOfStock + '_OutPut.xlsx', this.outputList, this.opHeaders, this.opHeadersMapping)
                        }
                    }
                    this.formatDisplayOPList()
                    this.showOutPutTable = true
                }
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
            item.numberOfNegativeYears = Number(item.numberOfNegativeYears)
            item.maxNegativePercentage = Number(item.maxNegativePercentage);

        });
    }
    formatOPListForYearWise(out_put_list: any[]): any[] {
        let list: any[] = []

        out_put_list[0].years.forEach((element: any) => {
            this.opHeaders.push(String(" " + element));
            this.opHeadersMapping.push(String(" " + element));
        });
        out_put_list.forEach((item) => {
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
            obj['tradesPerYear'] = Number(item.tradesPerYear);
            obj['absolutePercentPerYear'] = Number(item.absolutePercentPerYear);
            obj['annualReturn'] = Number(item.annualReturn);
            obj['numberOfNegativeYears'] = Number(item.numberOfNegativeYears);
            obj['negativePercentage'] = Number(item.negativePercentage);
            obj['maxNegativePercentage'] = Number(item.maxNegativePercentage);
            let number: number = 0;
            let key: any = '';
            let value: any = ''

            while (number <= item.years.length) {
                key = item.years[number]
                value = item.yearlyRetSum[item.years[number]]
                number++;
                obj[" " + key] = Number(value / 100 || 0.00)
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
            item.numberOfNegativeYears = Number(item.numberOfNegativeYears)
            item.maxNegativePercentage = this.formatPercentage(Number(item.maxNegativePercentage * 100));

        });
    }

    prevPage() {
        if (this.pageNumber > 1) {
            --this.pageNumber;
            this.startBackTest()
        }
    }
    nextPage1() {
        console.log("this.pageNumber", this.pageNumber)
        if (this.pageNumber > -1) {
            ++this.pageNumber;
            this.startBackTest()
        }
    }


    searchStock() {
        this.spinnerService.showSpinner(true)
        this.stocks = this.searchStocks.split(',').map(item => item.trim())
        let maxdate = this.datePipe.transform(this.maxDate, 'yyyy-MM-dd')
        if (this.stocks) {
            const payload = {
                symbols: this.stocks,
                startDate: this.datePipe.transform(this.dateRange[0], 'yyyy-MM-dd'),
                endDate: this.dateRange[1] ? this.datePipe.transform(this.dateRange[1], 'yyyy-MM-dd') : maxdate,
                isYahooAPI: this.isYahooAPI,

            }
            this.products = []
            this.stockData = []
            this.outputList = []
            this.outputData = []
            this.searchStocksData = []
            this.showOutPutTable = true
            this._stockService.deleteAllStockList().pipe(switchMap((val) =>
                this._stockService.searchStock(payload)
            )).subscribe((resp: any) => {
                this.spinnerService.showSpinner(false)
                if (!resp['error']) {
                    if (this.stocks.length > 1) {
                        this.stocks.forEach((element: string) => {
                            const obj = {
                                date: new Date(),
                                name: element
                            }
                            this.stockData.push(obj);
                        });
                    } else {
                        this.products = resp
                    }
                    const groupBy = (arr: any[], key: string) => {
                        const initialValue = {};
                        return arr.reduce((acc, cval) => {
                            const myAttribute = cval[key];
                            acc[myAttribute] = [...(acc[myAttribute] || []), cval]
                            return acc;
                        }, initialValue);
                    };

                    // let result = groupBy(resp, 'name') 
                    this.searchStocksData = groupBy(resp, 'name')

                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: resp['error'] });
                }

            })
        }

    }
    downloadSearchStocks() { 
        if (this.searchStocksData) (
            Object.entries(this.searchStocksData).forEach(([key, value]) => {
                value.map((product: any) => {
                    delete product.userId;
                    product.name = String(product.name);
                    product.period = this.datePipe.transform(product.period, 'yyyy-MM-dd');
                    product.high = String(Number(product.high).toFixed(2));
                    product.low = String(Number(product.low).toFixed(2));
                    product.open = String(Number(product.open).toFixed(2));
                    product.price = String(Number(product.price).toFixed(2));
                })
                const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(value);
                const wb: XLSX.WorkBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, key + '.xlsx');
            })
        )

    }
}
