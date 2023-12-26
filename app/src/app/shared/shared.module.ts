import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { UnauthorizedaccessComponent } from './components/unauthorizedaccess/unauthorizedaccess.component';
import { TwoDigitDecimalDirective } from './directives/two-digit-decimal.directive';

@NgModule({
  declarations: [
    PagenotfoundComponent,
    UnauthorizedaccessComponent,
    TwoDigitDecimalDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PagenotfoundComponent,
    TwoDigitDecimalDirective
  ],
  
})
export class SharedModule { }
