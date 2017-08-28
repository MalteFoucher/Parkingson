import { Component, OnInit, Input } from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { Buchung } from '../buchung';
import {Store} from '../store/store.service';

@Component({
  selector: 'buchungen-component',
  templateUrl: './buchungen.component.html',
  styleUrls: ['./buchungen.component.css']
})
export class BuchungenComponent implements OnInit {  
  userId: string="";
  yearValues: number[] = new Array();
  monthValues: string[] = new Array();
  //buchungValues: Buchung[] = new Array();  //erstmal nur string
  buchungsArray: any[] = new Array();
  userBuchungenMap = {};
  monatNamen : string[] = new Array("Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember");
  public myYear; 
  public myMonth;
  
  constructor(public store: Store) { 
    var now = moment();
    this.yearValues.push ( now.year() );
    this.monthValues.push ( this.monatNamen[now.months()] );   
    //this.buchungValues.push ( "Jahr und Monat auswählen...");
  }

  ngOnInit() {

    // Firebase Function aufrufen, die alle Jahre zurückliefert, zu denen Buchungen vorliegen
    // Vorerst schreib ich ins Dropdownmenü aber einfach ne 2017 und fertig.
  }

  public setUserId(id: string) {
    this.userId = id;
  }

  public onGoButton() {
    console.log ("Buchungen für den Zeitraum "+this.myYear+", "+this.myMonth);
    var buchungszeitraum_start = moment().year( this.myYear )    
    buchungszeitraum_start.month( this.monatNamen.indexOf(this.myMonth) );
    buchungszeitraum_start.date(1);
    console.log ("Start: "+ buchungszeitraum_start.format('DD.MM.YYYY')+ " (Tag "+buchungszeitraum_start.dayOfYear()+")");

    var buchungszeitraum_ende = buchungszeitraum_start.clone();
    buchungszeitraum_ende.add(1, 'month');
    buchungszeitraum_ende.subtract(1, 'day');
    console.log ("Ende: "+ buchungszeitraum_ende.format('DD.MM.YYYY')+ " (Tag "+buchungszeitraum_ende.dayOfYear()+")");

    //Arguments when ordered by Key müssen Strings sein
    var startDay = "" + buchungszeitraum_start.dayOfYear();
    var endDay = "" + buchungszeitraum_ende.dayOfYear();
    

    firebase.database().ref("/buchungen3/"+this.myYear).orderByKey().startAt(startDay).endAt(endDay).once('value', snapshot => {      
      this.buchungsArray=[];      
      var tagesKeys = Object.keys( snapshot.val() );
      for (var tk in tagesKeys) {
        let buchungsKeys = Object.keys( snapshot.val()[tagesKeys[tk]] );
        for (let bk in buchungsKeys) {
          var buchung = snapshot.val()[tagesKeys[tk]][buchungsKeys[bk]];
          
          if ( buchung.vId == this.userId ) {                                  
            //console.log ("user ist vId: vermietet an:"+buchung.mId);
            
            buchung["datum"] = moment().dayOfYear(parseInt(tagesKeys[tk])).format('DD.MM.YYYY');
            buchung["text"] = "Vermietet an: ";
            let email = this.store.getEmailToUid( buchung.mId );            
            if (email) {
              buchung["partner"] = '<a href="mailto:'+ email +'">'+email+'</a>';
            } else {
              buchung["partner"] = "Unbekannte UserId";
            }
            this.buchungsArray.push( buchung );
          }
          if ( buchung.mId == this.userId ) {                       
            //console.log ("user ist mId: gemietet von:"+buchung.vId);           
            //Hier werde ich wohl nicht prüfen müssen, ob vId=="". Obwohl sicherer wäre es.
            buchung["datum"] = moment().dayOfYear(parseInt(tagesKeys[tk])).format('DD.MM.YYYY');
            buchung["text"] = "Gemietet von: ";            
            //if mId=="" -> Niemanden
            let email = this.store.getEmailToUid( buchung.vId );
            if (email) {
              buchung["partner"] = '<a href="mailto:'+ email +'">'+email+'</a>';
            } else {
              buchung["partner"] = "Unbekannte UserId";
            }
            this.buchungsArray.push( buchung );
          }
        }        
      }
      
    });

      
  }

//Brauch ich wohl nicht mehr
  public onYearChanged() {
    console.log ("OYC: "+this.myYear);    
  }

  public onMonthChanged() {
    console.log ("OMC: "+this.myMonth);    
  }
}
