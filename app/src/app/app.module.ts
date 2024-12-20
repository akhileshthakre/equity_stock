import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TokenInterceptor } from './shared/interceptors/token.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { httpInterceptorProviders } from './shared/interceptors';
import { AuthGuardService } from './shared/guards/auth-guard.service';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    ChartModule,
    HttpClientModule,
    ProgressSpinnerModule,
    NgxSpinnerModule,
    ToastModule, MessagesModule, MessageModule 
  ],
  providers: [ httpInterceptorProviders, AuthGuardService],

  bootstrap: [AppComponent]
})
export class AppModule { }
