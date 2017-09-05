import { Component, OnInit, ViewChild } from '@angular/core';
declare var firebase: any;
import { MdDatepicker, MdDatepickerModule, MdSelectModule,MdSelect,MdDialog } from '@angular/material';
import * as moment from 'moment';
import { Auswertung } from './auswertung';
import { Vermieter } from './vermieter';
import {Store} from '../store/store.service';
import { DialogComponent } from '../dialog/dialog.component';
import {ParkConst} from "../util/const";

@Component({
  selector: 'auswertung-component',
  templateUrl: './auswertung.component.html',
  styleUrls: ['./auswertung.component.css']
})
export class AuswertungComponent implements OnInit {

  @ViewChild('vonPicker') picker_von: MdDatepicker<Date>;
  @ViewChild('bisPicker') picker_bis: MdDatepicker<Date>;
  @ViewChild('dropdown') mdSelector: MdSelect;


  //dialog: MdDialog;
  //Die Arrays brauch ich nur, weil das Template nicht über Maps iterieren kann.
  vermieterArray: Vermieter[] = new Array();
  vermieterMap = {};
  auswertungenArray: Auswertung[] = new Array();
  auswertungenMap = {};
  //myState ist doofer Name, ist die Auswahl aus dem vermiter drop down
  myState = null;

  vonInitDate = new Date(moment().subtract(1,'months').format('MM/DD/YYYY'));
  bisInitDate = new Date(moment().format('MM/DD/YYYY'));

  vonTag: number=0;
  bisTag: number=0;

  constructor(public store: Store, public dialog: MdDialog) {
    console.log ("Auswertung Konstruktor");
    //Erstmal ne Liste aller Vermieter besorgen (anhand der ParkId):

    //firebase.database().ref("/emailToRole/").orderByChild('parkId').startAt(1).once('value', this.e2rCallback);
    this.vermieterArray= this.store.getAlleVermieter();

  }

  public openPicker(i: number) {
    console.log("openPicker() ",i);
    if (i==1)this.picker_von.open();
    if (i==2)this.picker_bis.open();
  }

  public onGoButton() {
    console.log ("onGoButton()");
    this.auswertungenArray=[];
    this.auswertungenMap={};

    //Da ich es nicht gebacken bekomme, die Property _selected in ein Format zu überführen,
    //das einem moment-Konstruktor übergeben werden kann -> die umständliche Tour:
    var vonMoment = moment().date(this.picker_von._selected.getDate());
    vonMoment.month(this.picker_von._selected.getMonth());
    vonMoment.year(this.picker_von._selected.getFullYear());

    var bisMoment = moment().date(this.picker_bis._selected.getDate());
    bisMoment.month(this.picker_bis._selected.getMonth());
    bisMoment.year(this.picker_bis._selected.getFullYear());

    console.log ( vonMoment.format('DD.MM.YYYY')+ " -- "+bisMoment.format('DD.MM.YYYY') );
    console.log ( "Entspricht: "+vonMoment.dayOfYear() + " - "+bisMoment.dayOfYear());
    //Vorerst geh ich mal davon aus, start und ende sind valide.... (ende > start, beide selbes jahr, ?)
    //Muss aber noch überprüft werden!
    console.log ("OK? "+bisMoment.year()+"/"+vonMoment.year()+"/"+bisMoment.isAfter(vonMoment));
    if (bisMoment.year() != vonMoment.year() || vonMoment.isAfter(bisMoment, 'day')) {
      //Dialog aufploppen, der auf falsche Eingaben hinweist:
      let dialogRef = this.dialog.open(DialogComponent, {
          data:  {
            titel: 'Ungültige Eingaben',
            text:'Die Daten sind ungültig. Achten Sie darauf, dass<br>das Start- vorm Enddatum liegt und beide<br>in einem Jahr liegen.',
            yesButtonText: 'OK',
            yesButtonVisible: true,
            noButtonText:'Abbruch',
            noButtonVisible: false
          }
        });
      return;
    }


    var year = bisMoment.year();
    var startDay=""+vonMoment.dayOfYear();
    var endDay=""+bisMoment.dayOfYear();


    firebase.database().ref(ParkConst.BUCHUNGEN_PFAD + year).orderByKey().startAt(startDay).endAt(endDay).once('value', this.auswertungCallback);

  }



public e2rCallback = (snapshot) => {
  var keys = Object.keys(snapshot.val());
  for (var key in keys) {
    console.log (keys[key]+": "+snapshot.val()[keys[key]]);
    this.vermieterMap[snapshot.val()[keys[key]].uid] = keys[key].replace(/\!/g, '.');
    //this.vermieter.push(keys[key].replace(/\!/g, '.'));
    this.vermieterArray.push( new Vermieter( snapshot.val()[keys[key]].uid, keys[key].replace(/\!/g, '.')) );
  }
}

public auswertungCallback = (snapshot) => {
  console.log("auswertungCB");
  console.log(snapshot.val());


  if (snapshot.val()) {
    var tagesKeys = Object.keys(snapshot.val());
    for (var tk in tagesKeys) {
      var buchungsKeys = Object.keys(snapshot.val()[tagesKeys[tk]]);
      for (var bk in buchungsKeys) {
        var buchung = snapshot.val()[tagesKeys[tk]][buchungsKeys[bk]];

        //Prüfen, ob der Vermieter-Key der des im Dropdown ausgewählten ist:
        if ( !this.myState || this.myState==buchung.vId) {

          if (!(buchung.vId in this.auswertungenMap)) {
            this.auswertungenMap[buchung.vId] = new Auswertung(buchung.vId);
            console.log ("Suche email zu vID "+buchung.vId+": "+this.store.getEmailToUid(buchung.vId));
            this.auswertungenMap[buchung.vId].setParkId( this.store.getPidToUid(buchung.vId) );
            this.auswertungenMap[buchung.vId].setEmail( this.store.getEmailToUid(buchung.vId) );
            this.auswertungenMap[buchung.vId].incFreigaben();
          } else {
            //console.log("Vermieter-Key "+buchung.vermieter +" erhöhen...");
            this.auswertungenMap[buchung.vId].incFreigaben();//freigaben++;
          }
          // In der Annahme, dass es zu jeder Buchung auch einen Vermieter geben muss/wird!
          if (buchung.mId!="") this.auswertungenMap[buchung.vId].incGebucht();
        }
      }
    }
    //Übertragen der Map in das Array
    let auswertungKeys = (Object.keys(this.auswertungenMap));
    for (var i in auswertungKeys) {
      this.auswertungenArray.push(this.auswertungenMap[auswertungKeys[i]]);
    }

  }

}
  ngOnInit() {
  }

public onDropdownChange(value: any) {
  //War nur zum Debuggen drin

  console.log("ODC-State : "+  this.myState);
  //console.log("ODC-Select... : "+  this.mdSelector._selectionModel.selected) ;

}
}
