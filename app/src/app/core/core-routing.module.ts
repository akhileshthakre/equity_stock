import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutWithHfComponent } from './layout-with-hf/layout-with-hf.component';

const routes: Routes = [
  {
    path:'',
    component: LayoutWithHfComponent,
    children: [
      {
          path:'',
          loadChildren: () => import('../dashboard/dashboard.module').then(d => d.DashboardModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule { }
