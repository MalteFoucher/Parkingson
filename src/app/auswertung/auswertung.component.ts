import { Component, OnInit, ViewChild } from '@angular/core';
import * as firebase from 'firebase/app';
import { MdDatepicker, MdDatepickerModule, MdSelectModule,MdSelect } from '@angular/material';
import * as moment from 'moment';
import { Auswertung } from './auswertung';
import { Vermieter } from './vermieter';

@Component({
  selector: 'auswertung-component',
  templateUrl: './auswertung.component.html',
  styleUrls: ['./auswertung.component.css']
})
export class AuswertungComponent implements OnInit {

  @ViewChild('vonPicker') picker_von: MdDatepicker<Date>;
  @ViewChild('bisPicker') picker_bis: MdDatepicker<Date>;
  @ViewChild('dropdown') mdSelector: MdSelect;


  //Die Arrays brauch ich nur, weil das Template nicht über Maps iterieren kann.
  vermieterArray: Vermieter[] = new Array();
  vermieterMap = {};
  auswertungenArray: Auswertung[] = new Array();
  auswertungenMap = {};
  //myState ist doofer Name, ist die Auswahl aus dem vermiter drop down
  myState = null;
  vonDate = moment().format('DD-MM-YYYY');
  bisDate = moment();


  vonTag: number=0;
  bisTag: number=0;

  constructor() {
    console.log ("Auswertung Konstruktor");
    //Erstmal ne Liste aller Vermieter besorgen    
    firebase.database().ref("/emailToRole/").orderByChild('parkId').startAt(0).once('value', this.e2rCallback);
    //this.vonDate = moment().format('DD.MM.YYYY');
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
    //das einem moment-Konstruktor übergeben werden kann -> die umständliche Tour!
    var vonMoment = moment().date(this.picker_von._selected.getDate());
    vonMoment.month(this.picker_von._selected.getMonth());
    vonMoment.year(this.picker_bis._selected.getFullYear());
    
    var bisMoment = moment().date(this.picker_bis._selected.getDate());
    bisMoment.month(this.picker_bis._selected.getMonth());
    bisMoment.year(this.picker_bis._selected.getFullYear());
    
    console.log ( vonMoment.format('DD.MM.YYYY')+ " -- "+bisMoment.format('DD.MM.YYYY') );
    //Mal angenommen, start und ende sind valide.... (ende > start, beide selbes jahr, ?)
    //Muss hier noch überprüft werden!
    
    var vonKW = parseInt(vonMoment.format('WW'));
    this.vonTag = vonMoment.day();
    
    var bisKW = parseInt(bisMoment.format('WW'));
    this.bisTag = bisMoment.day();
    var year = bisMoment.year();

    console.log ("VonKW,-tag - BisKW,-tag: " ,vonKW, this.vonTag +" - "+ bisKW,this.bisTag);
    
    //Scheiße: //Warum hab ich hier scheiße hingeschribene?
    firebase.database().ref("/buchungen2/"+year).orderByKey().startAt("KW"+(vonKW)).endAt("KW"+(bisKW)).once('value', this.auswertungCallback);    

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
    var kwKeys = Object.keys(snapshot.val());
    console.log ("kwkeys lenht:"+ kwKeys.length );
    console.log ( "Keys der KWs: "+kwKeys);
    for (var kwKey in kwKeys) {
      var buchungenKeys = Object.keys(snapshot.val()[kwKeys[kwKey]]);
      console.log ("  BuchungsKeys der KW"+kwKeys[kwKey]+": "+buchungenKeys);
      for (var buchungKey in buchungenKeys) {
        var buchung = snapshot.val()[kwKeys[kwKey]][buchungenKeys[buchungKey]];
        console.log ("    Buchung vermieter/mieter: "+buchung.vermieter+" / "+buchung.mieter + " gesuchter Vermieter: "+this.myState+ " BuchTag/VonTag/BisTag=>"+buchung.tag+"/"+this.vonTag+"/"+this.bisTag);
        
        //Tage aussortieren, die nicht innerhalb Start- und Endtag liegen
        if ( (kwKey=='0' && buchung.tag < this.vonTag) || (parseInt(kwKey)== kwKeys.length-1 && buchung.tag > this.bisTag) ){
          console.log ("Buchung ("+kwKeys[kwKey] +"/"+buchung.tag+") aussortiert.");
          continue;
        }
        if ( !this.myState || this.myState==buchung.vermieter) {
          console.log ("Buchung ("+kwKeys[kwKey] +"/"+buchung.tag+") geht fit!");
          //Hier noch >=Start und <=End- Tag berücksichtigen!!! 
          //Das mach ich ambesten mit moments
          //Aus dem ausgelesenen KW und .Tag nen 
          if (!(buchung.vermieter in this.auswertungenMap)) {
            console.log("Vermieter-Key "+buchung.vermieter +" und dazugehörige Auswertung-Instanz anlegen...");
            //vermieterMap[buchung.vermieter] = {freigaben: 1, davon_gebucht: 0};          
            this.auswertungenMap[buchung.vermieter] = new Auswertung(buchung.vermieter, buchung.parkId);
            this.auswertungenMap[buchung.vermieter].setEmail( this.vermieterMap[buchung.vermieter]);
            this.auswertungenMap[buchung.vermieter].incFreigaben();
          } else {
            console.log("Vermieter-Key "+buchung.vermieter +" erhöhen...");
            this.auswertungenMap[buchung.vermieter].incFreigaben();//freigaben++;          
          }
          // In der Annahme, dass es zu jeder Buchung auch einen Vermieter geben muss/wird! 
          if (buchung.mieter!="") this.auswertungenMap[buchung.vermieter].incGebucht();
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
/*
public getEmailToUidAndSetItOnAuswertung(uid: string, auswertung: Auswertung) {
  firebase.database().ref("/emailToRole/").orderByChild("uid").equalTo(uid).once('value', function(snapshot) {
    console.log("getEmailToRole- Snapshot: "+snapshot);
    console.log ("Zur Id:"+uid+" gehört: "+snapshot.val());
    console.log(snapshot.val().key);
  });    
}
*/
  ngOnInit() {
  }

public onDropdownChange(value: any) {
  //War nur zum Debuggen drin
  
  console.log("ODC-State : "+  this.myState);
  //console.log("ODC-Select... : "+  this.mdSelector._selectionModel.selected) ;
  
}
}
