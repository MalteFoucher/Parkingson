import {Component, OnInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';
import {DialogComponent} from '../dialog/dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2>Hi! I am modal dialog!</h2>
    <button md-raised-button (click)="dialogRef.close()">Close dialog</button>`,
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {

  constructor(public dialogRef: MdDialogRef<DialogComponent>) {
  }

  ngOnInit() {
  }

}
