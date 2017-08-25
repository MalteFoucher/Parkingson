import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

import {MdButtonModule, MdDialog} from '@angular/material';
import { Http } from '@angular/http';
import { KalenderComponent } from './kalender.component';
import { LoginComponent } from './login/login.component';
import { AuswertungComponent } from './auswertung/auswertung.component';
import { BuchungenComponent } from './buchungen/buchungen.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
  //providers: [UserService]
  //providers: [ LoginComponent ]
})

export class AppComponent implements AfterViewInit{
  dialog: MdDialog;  
  dialogRef: any;

  title = 'app';
  user: Observable<firebase.User>;
  userRef: any;
  userId: string;
  userAdmin: boolean;
  userParkId: number=0;
  msgVal: string = '';
  debugText: string ="debugText";

  mieterMap: any=null;
  vermieterMap: any=null;
  
  @ViewChild(KalenderComponent)
  private kalender: KalenderComponent;
  @ViewChild(BuchungenComponent)
  private buchungen: BuchungenComponent;
  @ViewChild(AuswertungComponent)
  private auswertung: AuswertungComponent;

  constructor(public afAuth: AngularFireAuth, public af: AngularFireDatabase, private http: Http,  private cdRef: ChangeDetectorRef, dialog: MdDialog) {
    console.log("Constructor AppComponent");
    //this.userService.getUser().subscribe( data => console.log("Hier, dieser Service für http requests. Woltl ich doch einbauen!"+data) );

    this.dialog = dialog;
    this.user = this.afAuth.authState;
    firebase.auth().onAuthStateChanged( user => {
      //Eingeloggter user
      if (user) {        
        this.userId = user.uid;
        this.kalender.setUserId(this.userId);
        this.buchungen.setUserId(this.userId)
        this.debugText="Eingeloggt als: "+user.email;
        console.log (this.debugText);
        var emailAsKey=user.email.replace(/\./g, '!');

        //Statt email2Role, was völlig schwachsinnig war, einfach once aus der DB lesen!
        firebase.database().ref('/emailToRole/'+emailAsKey+'/').once('value', snapshot => {          
          if ( snapshot.val() != null ) {
            this.userAdmin= snapshot.val()['admin'];
            this.userParkId= snapshot.val()['parkId'];
              this.debugText="this.userParkId="+this.userParkId;
            
            this.kalender.setUserRights(this.userParkId, this.userAdmin);
            //Aufrufen nach (erneutem) Login
            //this.kalender.generateTable();            
          }
        });
        this.cdRef.detectChanges();
      }
      //Ausgeloggt...
      else {
        console.log ("AAAAAAAAAAAAAAA Login Dialog AAAAAAAAAAAAAAAA");
        //NOCH: Listener abmelden, KalenderView leeren
        this.dialogRef = this.dialog.open(LoginComponent, {
          disableClose: true
        });
        
        this.dialogRef.componentInstance.setAuth(this.afAuth);
        /*
        this.dialogRef.afterClosed().subscribe(selection => {
          console.log("Selection: "+selection);
          let email= (this.dialogRef.componentInstance.user_email);
          let pw= (this.dialogRef.componentInstance.user_password);
          //LoginButton geklickt
          if (selection) {
            //this.afAuth.auth.signInWithEmailAndPassword("123@abc.de", "AbcGuy123");
            this.afAuth.auth.signInWithEmailAndPassword(email, pw).catch(function(error) {
              console.log("AppComponent Login: "+ error.message);
            });
          } else {
            //RegisterButton geklickt
            
          }
        });
        */
      }
    });
  }


  login(email: string, pw: string) {
    //this.afAuth.auth.signInWithEmailAndPassword("123@abc.de", "AbcGuy123");
    this.afAuth.auth.signInWithEmailAndPassword(email, pw).catch(function(error) {
      console.log("error from log: "+error.message);
      this.dialogRef.componentInstance.fb_status = error.message;
      this.cdRef.detectChanges();
    });
  }

  logout() {
    this.afAuth.auth.signOut();
    this.userParkId=-1;
    this.kalender.userParkId=-1;
    this.userAdmin=false;
    this.kalender.generateTable();
  }

  ngAfterViewInit() {
    //Zu diesem Punkt noch zu früh, die parkId zu übermitteln. Wird nochmal aufgerufen, wenn sie tatsächlich da ist.
    //this.kalender.userParkId = this.userParkId;
    //this.cdRef.detectChanges();
    //this.kalender.setController(this);
  }

  public getVermieter() : firebase.Promise<any> {
    console.log("getVermieter()...");
    if (!this.vermieterMap) {      
          console.log ("Liegt noch nicht vor...")
          var promise = firebase.database().ref("/emailToRole/").orderByChild('parkId').startAt(0).once('value');

          //Wir geben erstmal ein Promise zum Selber-auswerten zurück aber gleichzeitig
          //brauchen wir ja die vermieterMap sonst wäre ja total dämlich
          promise.then((snapshot) => { 
              console.log ("Response von Anfrage in AppComponent: ");
              console.log(snapshot.val());
              this.vermieterMap=snapshot.val(); //.json; 
              return this.vermieterMap; } );
          
          return promise;
    } else {
      //Das müsste ich ja jetzt eigentlich in ein Promise wrappen ... iwie.
      console.log ("Liegt schon vor...");
      return this.vermieterMap;
    }
  }

    public getMieter(): any {
    console.log("getMieter()...");
    if (!this.vermieterMap) {      
          console.log ("Liegt noch nicht vor...")
          firebase.database().ref("/emailToRole/").orderByChild('parkId').startAt(0).once('value')
            .then((snapshot) => { 
              console.log ("Response von Anfrage: ");
              console.log(snapshot.val());
              this.vermieterMap=snapshot.val(); //.json; 
              return this.vermieterMap; } );
    } else {
      console.log ("Liegt schon vor...");
      return this.vermieterMap;
    }
  }

}
