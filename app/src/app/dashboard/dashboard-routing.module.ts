import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AuthGuardService } from '../shared/guards/auth-guard.service';
import { ExecutionComponent } from './components/execution/execution.component';

const routes: Routes = [
  {
    path:'',
    redirectTo: 'home',
    pathMatch:'full'
  },
  {
    path:'home',
    component: HomeComponent,  
    canActivate : [AuthGuardService]
  },
  {
    path:'execution',
    component: ExecutionComponent,  
    canActivate : [AuthGuardService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
