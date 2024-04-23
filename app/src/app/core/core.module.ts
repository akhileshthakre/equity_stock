import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LayoutWithHfComponent } from './layout-with-hf/layout-with-hf.component';
import { RouterModule } from '@angular/router';
import { CoreRoutingModule } from './core-routing.module';
import { StyleClassModule } from 'primeng/styleclass';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import {AvatarModule} from 'primeng/avatar';
import {BadgeModule} from 'primeng/badge';
import { FileUploadModule } from 'primeng/fileupload';
import { AuthGuardService } from '../shared/guards/auth-guard.service';
import { DialogModule } from 'primeng/dialog';
// import { NgxSpinnerModule } from 'ngx-spinner';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    LayoutWithHfComponent
  ],
  imports: [
    CommonModule,
    CoreRoutingModule,
    RouterModule,
    StyleClassModule,
    BreadcrumbModule,
    ButtonModule,
    RippleModule,
    DividerModule,
    AvatarModule,
    BadgeModule,
    FileUploadModule, DialogModule
  ],providers:[AuthGuardService]
})
export class CoreModule { }
