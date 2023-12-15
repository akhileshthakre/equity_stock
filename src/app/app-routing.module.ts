import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnauthorizedaccessComponent } from './shared/components/unauthorizedaccess/unauthorizedaccess.component';
import { PagenotfoundComponent } from './shared/components/pagenotfound/pagenotfound.component';

const routes: Routes = [
  {
    path:'',
    pathMatch: 'full',
    redirectTo: 'auth'
  },
  {
   path:'auth',
   loadChildren: () => import('./auth/auth.module').then(a => a.AuthModule)
  },
  {
    path:'dashboard',
    loadChildren: () => import('./core/core.module').then(c => c.CoreModule )
  },
  {
    path: 'unauthorized',
    component: UnauthorizedaccessComponent
  },
  {
    path: '**',
    component: PagenotfoundComponent
},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
