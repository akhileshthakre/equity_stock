import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { StocksApiService } from 'src/app/shared/apis/stocks.service';
import { SpinnerService } from 'src/app/shared/spinner/spinner.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  registerForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private formBuilder: FormBuilder, private spinnerService: SpinnerService, private apiCall: StocksApiService, private messageService: MessageService, private _route: Router) { }
  ngOnInit(): void {

  }

  register() {
    this.spinnerService.showSpinner(true)
    if (this.registerForm.valid) {
      let obj = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      }
      this.apiCall.registerUser(obj).subscribe(
        {
          next: (resp: any) => {
            this.spinnerService.showSpinner(false)
            if (resp) { 
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registered successfully' });
              this._route.navigate(['/auth/login'])
            } else {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to register' })
            }
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: "Failed to register" })
            this.spinnerService.showSpinner(false)
          }
        })

    } else {
      this.registerForm.markAllAsTouched();
    }
  }

}
