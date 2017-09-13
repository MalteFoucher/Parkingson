import { Component, OnInit, Input } from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { Buchung } from '../model/buchung';
import {Store} from '../store/store.service';
import {HttpClient} from '@angular/common/http';
import {ParkConst} from "../util/const";

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

  constructor(private store: Store, private http: HttpClient) {
    var now = moment();
    this.monthValues.push ( this.monatNamen[now.month()] );
    this.userId = store.getUserId();
  }

  ngOnInit() {
    // Firebase Function aufrufen, die alle Jahre zurückliefert, zu denen Buchungen vorliegen
    this.http.get ( "https://us-central1-parkplatztool.cloudfunctions.net/b3getJahre", {responseType: 'text'})
    .subscribe(data => {
      var tokens = data.toString().split(";");
      for (var t=0; t<tokens.length-1;t++) {
        this.yearValues.push ( parseInt(tokens[t]) );
      }
    }, err => {
      this.yearValues.push ( moment().year() );
    });
    this.myYear=moment().year();
    this.myMonth=this.monatNamen[ moment().month() ];

  }

  public setUserId(id: string) {
    console.log("SetUserId aufgerufen! Gibs ja garnicht!");
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

    firebase.database().ref(ParkConst.BUCHUNGEN_PFAD + this.myYear).orderByKey().startAt(startDay).endAt(endDay).once('value', snapshot => {
      this.buchungsArray=[];

      if (!snapshot.val()) {console.log ("Keine Values im Snapshot!");return;}

      var tagesKeys = Object.keys( snapshot.val() );
      for (var tk in tagesKeys) {
        let buchungsKeys = Object.keys( snapshot.val()[tagesKeys[tk]] );
        for (let bk in buchungsKeys) {
          var buchung = snapshot.val()[tagesKeys[tk]][buchungsKeys[bk]];

          if ( buchung.vId == this.userId ) {
            console.log ("user ist vId: vermietet an:"+buchung.mId);

            buchung["datum"] = moment().dayOfYear(parseInt(tagesKeys[tk])).format('DD.MM.YYYY');
            buchung["text"] = "Mieter: ";
            if (buchung.mId) {
              let email = this.store.getEmailToUid( buchung.mId );
              if (email) {
                buchung["partner"] = '<a href="mailto:'+ email +'">'+email+'</a>';
              } else {
                buchung["partner"] = "Unbekannte UserId";
              }
            } else {
              buchung["partner"] = "Niemand";
            }
            this.buchungsArray.push( buchung );
          }
          if ( buchung.mId == this.userId ) {
            console.log ("user ist mId: gemietet von:"+buchung.vId);

            buchung["datum"] = moment().dayOfYear(parseInt(tagesKeys[tk])).format('DD.MM.YYYY');
            buchung["text"] = "Vermieter: ";
            //Hier werde ich wohl nicht prüfen müssen, ob vId=="". Aber kostet ja nix.
            if (buchung.vId) {
              let email = this.store.getEmailToUid( buchung.vId );
              if (email) {
                buchung["partner"] = '<a href="mailto:'+ email +'">'+email+'</a>';
              } else {
                buchung["partner"] = "Unbekannte UserId";
              }
            } else {
              buchung["partner"] = "Niemand";
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
