import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-banner',
  templateUrl: './login-banner.component.html',
  styleUrls: ['./login-banner.component.scss']
})
export class LoginBannerComponent implements OnInit {
  features: any[] =  [
    { date: 'EQUITY', title: 'Lorem ipsum is really awesome', text: '' },
    { date: 'REASEARCH', title: 'Lorem ipsum is really awesome', text: '' },
];
  constructor() { }

  ngOnInit(): void {
  }

}
