import {Component, OnInit, ViewChild} from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import {Buchung} from './buchung';
import {Tablerow} from './tablerow';
import {MdDialog, MdSnackBar} from '@angular/material';
import {MdCheckbox, MdDatepicker} from '@angular/material';
import {DialogComponent} from './dialog/dialog.component';
import {AdminDialogComponent} from './admin-dialog/admin-dialog.component';

//import {Http, Response} from '@angular/http';
import {NgModule} from '@angular/core';
// Import HttpClientModule from @angular/common/http
import {HttpClient} from '@angular/common/http';

import {EmailService} from './email.service';

import {Store} from './store/store.service';
import {Vermieter} from './auswertung/vermieter';
import {ParkConst} from "./util/const";


@Component({
  selector: 'kalender-component',
  templateUrl: './kalender.component.html',
  styleUrls: ['./kalender.component.css']
})

export class KalenderComponent {

  @ViewChild('vonPicker') picker_von: MdDatepicker<Date>;

  testPassword: string = "";
  jahrestag="?";

  //Für das Jahres-Dropdown
  yearValues: number[] = new Array();
  myYear: number;

  parkplatzrows: any[] = new Array();
  vermieterArray: Vermieter[] = new Array();
  parkplatzMap = {};

  nurFreigabenAnzeigen: boolean = false;

  dialog: MdDialog;
  kw: number = 0;
  moment_today = moment();
  nodeRef: any;
  //snackBar: MdSnackBar;
  b3nodeRef: any;
  buchungen: any;
  userId: string = "initKalenderUserId";
  userParkId: number = -1;
  userAdmin: boolean = false;
  userEmail: string = "";
  toggleState: any;

  //Nur nötig für die debug-komponenten (email, csv-befüllung...)
  buchungsAdmin: boolean = false;
  benutzerAdmin: boolean = false;
  //controller: any;

  constructor(dialog: MdDialog, private store: Store, private emailService: EmailService, private http: HttpClient) {
    this.dialog = dialog;
    this.buchungsAdmin=store.buchungsAdmin;
    this.benutzerAdmin=store.benutzerAdmin;


    // Firebase Function aufrufen, die alle Jahre zurückliefert, zu denen Buchungen vorliegen
    this.http.get("https://us-central1-parkplatztool.cloudfunctions.net/b3getJahre", {responseType: 'text'})
      .subscribe(data => {
        var tokens = data.toString().split(";");
        for (var t = 0; t < tokens.length - 1; t++) {
          this.yearValues.push(parseInt(tokens[t]));
        }

      }, err => {
        this.yearValues.push(moment().year());
      });

  }

  ngOnInit() {
    //this.myYear = parseInt(moment().format('YYYY'));
  }


  generateTable() {
    firebase.database().ref(ParkConst.BUCHUNGEN_PFAD + this.myYear + '/').once('value').then(data => {
      console.log("JahresÜbersicht-Listener");
      var dayKeys = Object.keys(data.val());
      //console.log(dayKeys);
      for (var dk in dayKeys) {
        var monat = moment().dayOfYear(parseInt(dayKeys[dk])).month();
        console.log("Monat: " + monat);
        //console.log (dayKeys[dk]);
        var buchungsKeys = Object.keys(data.val()[dayKeys[dk]]);
        //console.log (buchungsKeys);
        for (var bk in buchungsKeys) {

          var buchung = data.val()[dayKeys[dk]][buchungsKeys[bk]];
          console.log(buchungsKeys[bk] + ": " + buchung.mId, buchung.vId, buchung.pId);
          var gebucht = 0;
          //grad nicht sicher, ob mId beim Freigeben angelegt wird.
          if (buchung.mId && buchung.mId != "") {
            gebucht = 1;
          }
          console.log(gebucht);
          //console.log (this.parkplatzMap);

          //Prüfen, ob Vermieter schon angelegt und falls nicht, anlegen!
          if (!(buchung.vId in this.parkplatzMap)) {
            this.parkplatzMap[buchung.vId] = {
              email: buchung.vId,
              pId: buchung.pId
            };
          }
          //Vermieter jetzt definitiv angelegt, aber auch der Monat?
          if (!(monat in this.parkplatzMap[buchung.vId])) {
            console.log("Für " + buchung.vId + " den Monat " + monat + " angelegt.");
            this.parkplatzMap[buchung.vId][monat] = {
              freigaben: 1,
              davon_gebucht: gebucht
            };
          } else {
            this.parkplatzMap[buchung.vId][monat].freigaben++;
            this.parkplatzMap[buchung.vId][monat].davon_gebucht = +gebucht;
          }

        }
      }
      console.log(" ___ ");
      //console.log (this.parkplatzMap);
      for (var pmKeys in this.parkplatzMap) {
        console.log("User: " + this.parkplatzMap[pmKeys]); //die User
        var user = this.parkplatzMap[pmKeys];
        var arrayEntry = {
          parkId: user.pId,//user.email,
          monat: {
            0: {frei: 0, buch: 0},
            1: {frei: 0, buch: 0},
            2: {frei: 0, buch: 0},
            3: {frei: 0, buch: 0},
            4: {frei: 0, buch: 0},
            5: {frei: 0, buch: 0},
            6: {frei: 0, buch: 0},
            7: {frei: 0, buch: 0},
            8: {frei: 0, buch: 0},
            9: {frei: 0, buch: 0},
            10: {frei: 0, buch: 0},
            11: {frei: 0, buch: 0}
          },
          total: '0'
        };

        //arrayEntry[email]= user.parkId;
        var sum_frei = 0
        var sum_buch = 0;
        for (var month = 0; month < 12; month++) {
          if (user[month]) {
            arrayEntry['monat'][month] = {frei: user[month]['freigaben'], buch: user[month]['davon_gebucht']};
            sum_frei += user[month]['freigaben'];
            sum_buch += user[month]['davon_gebucht'];
          }
        }
        arrayEntry['total'] = sum_buch + "/" + sum_frei;//((sum_buch/sum_frei)*100).toFixed(2);
        this.parkplatzrows.push(arrayEntry);
      }
    });


  }

  setUserId(uid: string): void {
    this.userId = uid;
  }


//debug
  writeNewBuchung() {
    var tag = <number> moment().dayOfYear();
    //tag += Math.round( (Math.random() * 90)-45 );
    tag = Math.round(Math.random() * 60);
    var pp = Math.round(Math.random() * 250);
    console.log("WnB: " + this.myYear + " / " + tag + " /" + pp);
    var mmt = moment().year(this.myYear).dayOfYear(tag);
    console.log("Tag " + tag + " in " + this.myYear + " entspricht: " + mmt.format('DD.MM.YYYY'));
    //Year und Tag kommen im endeffekt dann von der selectierten zelle natürlich
    var b3nodeRef = firebase.database().ref(ParkConst.BUCHUNGEN_PFAD + this.myYear + '/' + tag);

    var newPostRef = b3nodeRef.push();
    newPostRef.set({
      mId: "",
      vId: this.userId,
      pId: pp
    });
  }

  writeNewUser() {
    var newPostRef = firebase.database().ref('/emailToRole/malte_kun@web!de')
      .set({
        benutzerAdmin: false,
        buchungsAdmin: false,
        isActive: true,
        parkId: 0,
        uid: "sechsSiebenAcht"
      });

  }


//debug
  private writeNewbuchung() {
    console.log("WNB: NodeRef:");
    console.log(this.nodeRef);
    var newPostRef = this.nodeRef.push();
    newPostRef.set({
      mieter: "",
      vermieter: this.userId,
      parkId: this.userParkId,
      tag: 4,
      datum: "24.08.2017"
    });

  }

  /*Wird das ncoh genutzt?
  private getEmailToUid(uid: string, callbackFunction: any, callbackData: any) {
    firebase.database().ref("/emailToRole/").orderByChild('uid').equalTo(uid).once('value').then(function (snapshot) {
      callbackFunction(snapshot.val(), callbackData);
    });
  }*/


/*
  public setUserRights(pid: number, admin: boolean, email: string) {
    this.userParkId = pid;
    this.userAdmin = admin;
    this.userEmail = email;
    //this.nodeRef=firebase.database().ref('/buchungen2/'+this.year+'/KW'+this.kw+'/');
    //this.nodeRef.orderByChild('parkId').on('value', this.buchungListener);
  }
*/
  emailTesten() {
    console.log("EMIALTESTEN");
    this.emailService.sendEmail(this.userEmail).subscribe(data => console.log(data));
  }

//CSV
  handleFileSelect(evt) {
    var files = evt.target.files;
    console.log("HFS");
    console.log(files[0], typeof(files[0]));
    var reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = function (event) {
      var tokens = event.target['result'].split(";");
      console.log(tokens.length);

      var lines = event.target['result'].split(/\n/);

      for (var l in lines) {
        var tokens = lines[l].split(";");
        var emailAsKey = tokens[1] + "!" + tokens[0] + "@deka!lu";
        //var emailAsKey = tokens[3].replace(/\./g,'!');
        emailAsKey = emailAsKey.toLowerCase();
        emailAsKey = emailAsKey.replace(/ö/g, 'oe')
        emailAsKey = emailAsKey.replace(/ä/g, 'oe')
        emailAsKey = emailAsKey.replace(/ü/g, 'ue')
        emailAsKey = emailAsKey.replace(/ß/g, 'ss')
        emailAsKey = emailAsKey.replace(/ /g, '');


        var parkId = parseInt(tokens[2]);
        if (isNaN(parkId)) parkId = 0;

        console.log('/emailToRole/' + emailAsKey + '/: ' + parkId);

        firebase.database().ref('/emailToRole/' + emailAsKey + '/')
          .set({
            benutzerAdmin: false,
            buchungsAdmin: false,
            parkId: parkId,
            isActive: false,
            uid: 'not set yet'
          });
      }
      console.log(lines.length + " Einträge geSETtet.");
    }
  }

  handleFileSelectUpdate(evt) {
    var files = evt.target.files;
    console.log("HFS");
    console.log(files[0], typeof(files[0]));
    var reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = function (event) {
      var tokens = event.target['result'].split(";");
      console.log(tokens.length);

      var lines = event.target['result'].split(/\n/);

      for (var l in lines) {
        var tokens = lines[l].split(";");
        var emailAsKey = tokens[1] + "!" + tokens[0] + "@deka!lu";
        //var emailAsKey = tokens[3].replace(/\./g,'!');
        emailAsKey = emailAsKey.toLowerCase();
        emailAsKey = emailAsKey.replace(/ö/g, 'oe')
        emailAsKey = emailAsKey.replace(/ä/g, 'oe')
        emailAsKey = emailAsKey.replace(/ü/g, 'ue')
        emailAsKey = emailAsKey.replace(/ß/g, 'ss')
        emailAsKey = emailAsKey.replace(/ /g, '');

        var parkId = parseInt(tokens[2]);
        if (isNaN(parkId)) parkId = 0;

        console.log('/emailToRole/' + emailAsKey + '/: ' + parkId);
        
        firebase.database().ref('/emailToRole/' + emailAsKey + '/')
          .update({
            parkId: parkId,
          });
      }
      console.log(lines.length + " Einträge geUPDATEt.");
    }
  }

  getJahre() {
    console.log("GetJahre")
    this.http.get("https://us-central1-parkplatztool.cloudfunctions.net/b3getJahre", {responseType: 'text'})
    //.map((res:Response) => res.json())
      .subscribe(data => {
        console.log("Subscription!");
        console.log(data);
        var tokens = data.toString().split(";");
        console.log(tokens);

      }, err => {
        console.log(err);
      });

  }

  evalPW() {
    console.log("Eval PW: " + this.testPassword);
    const kleinBS = /[a-z]/;
    const grossBS = /[A-Z]/;
    const ziffern = /[0-9]/;
    const sonderz = /\W/;

    var zeichenTypenUsed = 0;

    if (kleinBS.test(this.testPassword)) zeichenTypenUsed++;
    if (grossBS.test(this.testPassword)) zeichenTypenUsed++;
    if (ziffern.test(this.testPassword)) zeichenTypenUsed++;
    if (sonderz.test(this.testPassword)) zeichenTypenUsed++;

    var valide = this.testPassword.length >= 10 && zeichenTypenUsed >= 3;
    console.log(valide);
  }

  evalEmail() {
    /*console.log("Eval Email: " + this.testPassword);
    this.testPassword = this.testPassword.toLowerCase();
    this.testPassword.replace(/ö/g, 'oe');
    this.testPassword.replace(/ä/g, 'oe');
    this.testPassword.replace(/ü/g, 'ue');
    this.testPassword.replace(/ß/g, 'ss');
    console.log(this.testPassword);*/
    var vermieter="VplQA1HK7rVRWESUfNx07SKzadY2";
    var mieter="YigUSZAZGYT607yegts1edNNqEC3";
    var text ="Blablabla";
    console.log("MAIL: vermieter: " + vermieter+" / mieter: " + mieter+ " / "+text);
  //Jetzt die Email-Adressen zu den IDs beziehen
  var ref = firebase.database().ref('/emailToRole/');
  //Vermieter dürfte ja stets !=null sein.
  ref.orderByChild('uid').equalTo(vermieter).once('value').then( data => {
    //Vermieter-Adresse haben wir
    console.log ("Vermieter:");
    console.log(Object.keys(data.val()));
    console.log ("Email des Vermieters: "+Object.keys(data.val())[0].replace(/!/g,'.'));
    if (mieter) {
        ref.orderByChild('uid').equalTo(mieter).once('value').then( data => {
        //Mieter-Adresse haben wir auch
        console.log ("Mieter:");
        console.log (Object.keys(data.val()));
        console.log ("Email des Mieters: "+Object.keys(data.val())[0].replace(/!/g,'.'));
        //Und nu? Email an beide? Bzw an alle !=null?
    },error => {
      console.log ("ERROR: "+error);
    })
    }
  });
  }

  public onYearChanged() {
    console.log("OYC: " + this.myYear);
    delete this.parkplatzrows;
    this.parkplatzrows = new Array();
    delete this.parkplatzMap;
    this.parkplatzMap = {};
    this.generateTable();
  }

onDateChange() {
    var vonMoment = moment().date(this.picker_von._selected.getDate());
    vonMoment.month(this.picker_von._selected.getMonth());
    vonMoment.year(this.picker_von._selected.getFullYear());
    this.jahrestag=" "+vonMoment.dayOfYear();
    console.log(this.jahrestag);
}
}
