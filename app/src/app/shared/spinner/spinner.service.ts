import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  isShowSpinner = new BehaviorSubject<boolean>(false);
  isShowSpinnerValue = this.isShowSpinner.asObservable();

  constructor(private spinnerService: NgxSpinnerService) { }



  showSpinner(val: boolean) {
    this.isShowSpinner.next(val);
  }


  getSpinnerStatus(): any {
    let status: boolean = false
    this.isShowSpinner.subscribe(res => {
      if (res) {
        // console.log(res);
        status = res
      }
    })
    return status;
  }

}
