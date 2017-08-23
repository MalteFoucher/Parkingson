import { Component, OnInit, Input } from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { Buchung } from '../buchung';

@Component({
  selector: 'buchungen-component',
  templateUrl: './buchungen.component.html',
  styleUrls: ['./buchungen.component.css']
})
export class BuchungenComponent implements OnInit {
  
  userId: string="";
  yearValues: number[] = new Array();
  monthValues: string[] = new Array();
  buchungValues: Buchung[] = new Array();  //erstmal nur string
  userBuchungenMap = {};
  monatNamen : string[] = new Array("Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember");
  public myYear; 
  public myMonth;
  
  constructor() { 
    var now = moment();
    this.yearValues.push ( now.year() );
    this.monthValues.push ( this.monatNamen[now.months()] );   
    //this.buchungValues.push ( "Jahr und Monat auswählen...");
  }

  ngOnInit() {
  }

  public setUserId(id: string) {
    this.userId = id;
  }

  public onGoButton() {
    console.log ("Jo dann wollen wir mal! "+this.userId);
    this.yearValues=[];
    this.userBuchungenMap={};
  //this.userBuchungenMap={};
  
    //Ich glaub da mache ich lieber ne CloudFunction für! Definitiv!

    //firebase.database().ref("/buchungen2/").orderByChild('parkId').startAt(1).once('value', snapshot => {
    firebase.database().ref("/buchungen2/").orderByKey().once('value', snapshot => {
      
      //console.log ("snapshot:");
      //console.log (snapshot.val());
      var jahresKeys = Object.keys(snapshot.val());
      console.log ("JahresKeys:"+jahresKeys);

      for (var jahr in jahresKeys) {
        var year = jahresKeys[jahr];
        var wochenKeys = Object.keys(snapshot.val()[year]);
        console.log ("WochenKeys:"+wochenKeys);

        for (var woche in wochenKeys) {
          var buchungsKeys = Object.keys(snapshot.val()[jahresKeys[jahr]][wochenKeys[woche]]);
          console.log ("BuchungsKeys: "+buchungsKeys);

            for (var bk in buchungsKeys) {
              var buchung = snapshot.val()[jahresKeys[jahr]][wochenKeys[woche]][buchungsKeys[bk]];
              console.log("Buchung: ");
              console.log(buchung);
              if (buchung.vermieter == this.userId) {
                //alleUserVermietungen.push (buchung);
                var buchung_moment = moment();                
                buchung_moment.year(parseInt(year));                
                buchung_moment.isoWeek( parseInt(wochenKeys[woche].slice(2)) );
                buchung_moment.isoWeekday( buchung.tag);                
                var month = buchung_moment.month();
                
                if (!(year in this.userBuchungenMap)) {
                  //Neuen Eintrag für das aktuelle Jahr anlegen
                  console.log("Year "+year+" was not yet in buchungenMap!");
                  this.userBuchungenMap[year] = {}
                }
                if (!(month in this.userBuchungenMap[year])) {
                  //Neuen Eintrag für den aktuellen Monat anlegen
                  console.log("Month "+month+" was not yet in buchungenMap!");
                  this.userBuchungenMap[year][month] = {}
                }
                //Buchung in die userBuchungMap einsortieren unter Jahr:Monat:Key
                var buchungObject = new Buchung( buchung.vermieter, buchung.mieter, buchung.bezahlt, buchung.erhalten, buchung.tag, buchung.parkId, buchung.key);
                buchungObject.setDateString(buchung_moment.format('DD.MM.YYYY'));
                this.userBuchungenMap[year][month][buchungsKeys[bk]]=buchungObject;

                  

                //console.log (buchung);
              }
            }
        }
      }
      //Also auf Konsole kann man anzeigen, aber muss ich jetzt noch schick machen!
      console.log ( " " );
      console.log (this.userBuchungenMap);
      var yearKeys = Object.keys(this.userBuchungenMap);
      for (var yk in yearKeys)
      {
        this.yearValues.push( parseInt(yearKeys[yk]) );
      }

      console.log ("userBuchungenMap[2017]: "+this.userBuchungenMap[2017]);
      console.log ("Keys von userBuchungenMap[2017]: "+Object.keys(this.userBuchungenMap[2017]));

      for (var m in this.userBuchungenMap[2017]) {
        console.log ("Month: "+m);
        var monthKeys = Object.keys(this.userBuchungenMap[2017][m]);
        console.log ("Vermietungen im  Monat "+this.monatNamen[m]+":");
        for (var mk in monthKeys) {
          console.log( this.userBuchungenMap[2017][m][monthKeys[mk]] );
        }
      }    
    });
  }

  public onYearChanged() {
    console.log ("OYC: "+this.myYear);
    //Monatsliste updaten
    //var monthKeys = Object.keys(this.userBuchungenMap[this.myYear]);
    this.monthValues=[];
    for (var mk in this.userBuchungenMap[this.myYear]) {
      console.log ("Füge zu monthValues hinzu: ");
      console.log (this.userBuchungenMap[this.myYear][mk]);
      console.log( this.monatNamen[mk]);//this.userBuchungenMap[this.myYear][monthKeys[mk]]] );
      this.monthValues.push ( this.monatNamen[mk] );
    }
  }

  public onMonthChanged() {
    console.log ("OMC: "+this.myMonth);
    //Mist, jetzt krieg ich über .myMonth den Namen :/ 
    //Gibts nen array.indexOf(string) ??? Gibt es :D
    var monthIndex = this.monatNamen.indexOf(this.myMonth);
    
    //Buchungsliste updaten
    this.buchungValues=[];
    console.log ( this.userBuchungenMap[this.myYear][monthIndex] +" / "+monthIndex);
    var buchKeys = Object.keys(this.userBuchungenMap[this.myYear][monthIndex]);
    console.log ("Vermietungen im  Monat "+this.myMonth+":");
        for (var bk in buchKeys) {
          
          var buchung = this.userBuchungenMap[this.myYear][monthIndex][buchKeys[bk]] ;
          console.log (buchung);
          this.buchungValues.push ( buchung );
          //this.buchungValues.push ( "Mieter: "+ buchung.mieter);
        }
  }
}
