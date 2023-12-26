import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { SpinnerService } from './shared/spinner/spinner.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'project-trade';
  showSpinner: Observable<boolean> = of(false)
  typeSelected = 'ball-atom';
  constructor(private spinnerService: SpinnerService) { }

  ngOnInit(): void {
    this.getShowSpinnerStatus()
  }

  getShowSpinnerStatus() { 
    this.spinnerService.isShowSpinnerValue.subscribe(data => {
      this.showSpinner = of(data) 
    }) 
  }

}
