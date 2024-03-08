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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SharedModule } from '../shared/shared.module'; 
import { ProgressSpinnerModule } from 'primeng/progressspinner'; 
import { AuthGuardService } from '../shared/guards/auth-guard.service';
import { ExecutionComponent } from './components/execution/execution.component';


@NgModule({
  declarations: [
    HomeComponent,
    ExecutionComponent
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
    FormsModule,
    ProgressSpinnerModule, 
  ],
  providers : [AuthGuardService]
})
export class DashboardModule { }
