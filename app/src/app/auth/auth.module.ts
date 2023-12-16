import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { LoginBannerComponent } from './common/login-banner/login-banner.component';
import { LoginFooterComponent } from './common/login-footer/login-footer.component';
import { DividerModule } from 'primeng/divider';
import { CarouselModule } from 'primeng/carousel';
import { StyleClassModule } from 'primeng/styleclass';
import { RippleModule } from 'primeng/ripple';

@NgModule({
  declarations: [
    LoginComponent,
    LoginBannerComponent,
    LoginFooterComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    RippleModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    DividerModule,
    CarouselModule,
    StyleClassModule
  ]
})
export class AuthModule { }
