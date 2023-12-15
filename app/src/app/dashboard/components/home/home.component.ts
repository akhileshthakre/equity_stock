import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UploadEvent } from 'primeng/fileupload';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [MessageService]
})
export class HomeComponent implements OnInit {
    data: any;
    options: any;
    uploadedFiles: any[] = [];
    products: any[] = []
    

    constructor(private messageService: MessageService, private _stockService: StocksApiService) { }

    ngOnInit() { 
        this.loadStockChart();
        this.getStocksFile();
    }
    loadStockChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.data = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'Aug'],
            datasets: [
                {
                    label: 'First Dataset',
                    data: [80, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--blue-500'),
                    tension: 0.4
                },
                {
                    label: 'Second Dataset',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--pink-500'),
                    tension: 0.4
                }
            ]
        };

        this.options = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }

    onUpload(event: any,fileUpload: any) {
        for (let file of event.files) {
            this.uploadedFiles.push(file);
        } 
        this._stockService.uploadStockXlsxFile(this.uploadedFiles).subscribe({
            next: (res: any) => {              
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File Uploaded' });
                this.getStocksFile(); 
                while(this.uploadedFiles.length){
                    this.uploadedFiles.pop();
                }
                fileUpload.clear()   
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
            }
        })
        //this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
    }

    getStocksFile() {
        this._stockService.getAllStockInfo().subscribe({
            next: (res) => {  
                this.products = res.data
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload Failed' });
            }

        })
    }
}
