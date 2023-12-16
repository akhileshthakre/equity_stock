import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup = new FormGroup({});

  constructor(private formBuilder: FormBuilder,private _route:Router) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['admin', Validators.required],
      password: ['admin', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
      if(this.loginForm.value.username = 'admin' && this.loginForm.value.password == 'admin'){
        this._route.navigate(['/dashboard'])
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
