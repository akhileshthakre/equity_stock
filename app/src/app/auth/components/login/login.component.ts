import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService]
})
export class LoginComponent {
  loginForm: FormGroup = new FormGroup({});

  constructor(private spinnerService: SpinnerService, private messageService: MessageService, private formBuilder: FormBuilder, private _route: Router, private apiCall: StocksApiService) {
    localStorage.clear()
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    this.spinnerService.showSpinner(true)
    if (this.loginForm.valid) {
      let obj = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
      }
      this.apiCall.getToken(obj).subscribe(
        {
          next: (resp: any) => {
            this.spinnerService.showSpinner(false)
            if (resp) {
              localStorage.setItem('token', resp.token)
              this._route.navigate(['/dashboard'])
            } else {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to login' })
            }
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: "Invalid username or password" })
            this.spinnerService.showSpinner(false)
          }
        })
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
