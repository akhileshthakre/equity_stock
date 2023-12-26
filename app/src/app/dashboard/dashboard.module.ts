import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'primeng/tooltip';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './components/home/home.component';
import { ChartModule } from 'primeng/chart';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SharedModule } from '../shared/shared.module'; 
import { ProgressSpinnerModule } from 'primeng/progressspinner'; 

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ChartModule,
    FileUploadModule,
    ToastModule,
    CardModule,
    TableModule,
    TooltipModule,
    ReactiveFormsModule,
    InputTextModule,
    SharedModule,
    ProgressSpinnerModule, 
  ]
})
export class DashboardModule { }
