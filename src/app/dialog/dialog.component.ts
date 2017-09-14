import { Component, OnInit, Inject } from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-dialog', //wird eh nie fix im HTML stehen, schmeißt deshalb auch nen Error.
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {
  titel: string="Parking Tool";
  text: string="Dialogtext bzw HTML...";
  yesButtonVisible: boolean=true;
  yesButtonText: string="JA";
  noButtonVisible: boolean=false;
  noButtonText: string="NEIN";

    vermieter: string="";
    userPid: number;

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    this.titel = data.titel;
    this.text=data.text;
    this.yesButtonText=data.yesButtonText;
    this.yesButtonVisible=data.yesButtonVisible;
    this.noButtonText=data.noButtonText;
    this.noButtonVisible=data.noButtonVisible;

    if (data.buchung) this.vermieter = data.buchung.vermieter;
    this.userPid = data.userPid;

   }

  ngOnInit() {
  }

}
