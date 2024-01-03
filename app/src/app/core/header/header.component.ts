import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(private _route: Router){}
  onUpload(e:any){}
  logOut(){
    localStorage.clear()
    this._route.navigate(['/auth/login'])
  }
  goToExecution(){ 
    this._route.navigate(['/dashboard/execution'])
  }
  goToHome(){ 
    this._route.navigate(['/dashboard/home'])
  }
}
