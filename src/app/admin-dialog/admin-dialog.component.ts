import {Component, OnInit, Inject, ViewChild} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {MdDialogModule, MdSelect} from '@angular/material';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-admin-dialog', //wird eh nie fix im HTML stehen, schmeißt deshalb auch nen Error.
  templateUrl: './admin-dialog.component.html',
  styleUrls: ['./admin-dialog.component.css']
})
export class AdminDialogComponent implements OnInit {

  @ViewChild('vermieterSelect') mdSelector: MdSelect;
  myVermieterState = null;

  newUserEmail: string="";

  titel: string = "Parking Tool";
  text: string = "Dialogtext...";
  yesButtonVisible: boolean = true;
  yesButtonText: string = "JA";
  noButtonVisible: boolean = false;
  noButtonText: string = "NEIN";
  

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    console.log("AdminDialog-Konstruktor");
    this.titel = data.titel;
    this.text = data.text;
    this.yesButtonText = data.yesButtonText;
    this.yesButtonVisible = data.yesButtonVisible;
    this.noButtonText = data.noButtonText;
    this.noButtonVisible = data.noButtonVisible;    
  }

  ngOnInit() {
    //var vermieter = this.controller.getVermieter();
    //console.log("onInit ADC: " + this.vermieterArray.length);
  }

  getNewEmail(): string {
    return this.newUserEmail;
  }

  
}
