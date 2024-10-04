import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagenotfoundComponent } from './components/pagenotfound/pagenotfound.component';
import { UnauthorizedaccessComponent } from './components/unauthorizedaccess/unauthorizedaccess.component';
import { TwoDigitDecimalDirective } from './directives/two-digit-decimal.directive';
import { TwoDigitDecimalDirectiveWithNegative } from './directives/two-digit-decimal-with-negative.directive';

@NgModule({
  declarations: [
    PagenotfoundComponent,
    UnauthorizedaccessComponent,
    TwoDigitDecimalDirective,
    TwoDigitDecimalDirectiveWithNegative
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PagenotfoundComponent,
    TwoDigitDecimalDirective,
    TwoDigitDecimalDirectiveWithNegative
  ],
  
})
export class SharedModule { }
