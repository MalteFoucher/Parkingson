import { Component, OnInit, Inject, ViewChild } from '@angular/core';
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

  titel: string="Parking Tool";
  text: string="Dialogtext...";
  yesButtonVisible: boolean=true;
  yesButtonText: string="JA";
  noButtonVisible: boolean=false;
  noButtonText: string="NEIN";
  deleteButtonVisible: boolean=false;
  deleteButtonText: string="Freigabe löschen";

  vermieter: string="vermieter";
  mieter: string="mieter"
  userPid: number;
  //Sowas wie ANLEGEN oder EDITIEREN
  modus: string;

  mieterMap: any;  
  vermieterMap: any;
  mieterArray: string[]=[];
  vermieterArray: string[]=[];
  controller: any;

  // Wo kriege ich jetzt Listen der (Ver-)mieter her? -> erstmal selber laden, auch wenn das an anderer
  // evtl Stelle schonmal gemacht wurde. Evtl kann man das so regeln, dass das nicht zweimal geladen wird.

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    console.log ("AdminDialog-Konstruktor");
    this.titel = data.titel;
    this.text=data.text;
    this.yesButtonText=data.yesButtonText;
    this.yesButtonVisible=data.yesButtonVisible;
    this.noButtonText=data.noButtonText;
    this.noButtonVisible=data.noButtonVisible;
    this.deleteButtonText=data.deleteButtonText;
    this.deleteButtonVisible=data.deleteButtonVisible;

    this.vermieter = data.buchung.vermieter;
    this.userPid = data.userPid;
    this.modus = data.modus;
    this.controller = data.controller;
    
    //Erstmal ne Abfrage, wer alles Vermieter und wer Mieter ist.        
    //console.log ("Aufruf von getVermieter auf :");
    //console.log(this.controller);
    //this.vermieterMap = this.controller.getVermieter();
    //this.getMyselfSomeDataPromise = this.controller.getVermieter();
    //console.log ("Promise bezogen:");
    //console.log (this.getMyselfSomeDataPromise);

    //this.getMyselfSomeDataPromise
    firebase.database().ref("/emailToRole/").orderByChild('parkId').startAt(1).once('value', snapshot => {
      console.log("db listener von AdminDialogCompo");
      console.log(snapshot.val());
      this.vermieterMap=snapshot.val(); //.json;             
      var vermieterKeys = Object.keys(snapshot.val());      
      for (var v in vermieterKeys) {        
        var vermieter = vermieterKeys[v];
        this.vermieterArray.push( vermieter.replace(/\!/g, '.') );
      }
    } );
    
            
    /*console.log (this.vermieterMap);
    for (var v in Object.keys(this.vermieterMap)) {
      this.vermieterArray.push(v);//replace
    }*/
   }

  ngOnInit() {
    //var vermieter = this.controller.getVermieter();
    console.log ("onInit ADC: "+this.vermieterArray.length);
  }

  onSelectChange() {
    console.log ("OSC");
    console.log ( this.myVermieterState );
    console.log ( this.vermieterMap[ this.myVermieterState.replace(/\./g, '!') ])
  }

  getSelectedVermieter() {    
    return ( this.vermieterMap[ this.myVermieterState.replace(/\./g, '!') ])
  }

  
}
