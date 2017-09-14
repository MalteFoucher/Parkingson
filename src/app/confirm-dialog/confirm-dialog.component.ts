import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';
import {DialogComponent} from '../dialog/dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {

  constructor(public dialogRef: MdDialogRef<ConfirmDialogComponent>) {
  }

  ngOnInit() {
  }

  ok() {
    this.dialogRef.close('ok');
  }

  close() {
    this.dialogRef.close();
  }


}
