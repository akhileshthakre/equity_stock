import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { UnauthorizedaccessComponent } from './components/unauthorizedaccess/unauthorizedaccess.component';



@NgModule({
  declarations: [
    PagenotfoundComponent,
    UnauthorizedaccessComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PagenotfoundComponent
  ]
})
export class SharedModule { }
