import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';
import {DialogComponent} from '../dialog/dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {

  constructor(public dialogRef: MdDialogRef<DialogComponent>, private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
  }

  ok() {
    console.log('ok');
    this.dialogRef.close('ok');
    this.changeDetector.detectChanges();
  }

  close() {
    console.log('close');
    this.dialogRef.close();
    this.changeDetector.detectChanges();
  }


}
