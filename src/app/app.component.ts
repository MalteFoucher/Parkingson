import {Component, ViewChild, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable} from 'angularfire2/database';
import {AngularFireAuth} from 'angularfire2/auth';
import {Observable} from 'rxjs/Observable';
import * as firebase from 'firebase/app';

import {MdButtonModule, MdDialog, MdDialogRef} from '@angular/material';
import {Http} from '@angular/http';
import {KalenderComponent} from './kalender.component';
import {LoginComponent} from './login/login.component';
import {AuswertungComponent} from './auswertung/auswertung.component';
import {BuchungenComponent} from './buchungen/buchungen.component';
import {DialogComponent} from './dialog/dialog.component';
import {Store} from './store/store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements AfterViewInit {
  dialog: MdDialog;
  //dialogRef: MdDialogRef;

  content = 'login';

  user;
  title = 'app';
  userId: string;
  userAdmin: boolean;
  userParkId = 0;
  debugText = 'debugText';

  @ViewChild(KalenderComponent)
  private kalender: KalenderComponent;
  @ViewChild(BuchungenComponent)
  private buchungen: BuchungenComponent;
  @ViewChild(AuswertungComponent)
  private auswertung: AuswertungComponent;

  constructor(public afAuth: AngularFireAuth, public af: AngularFireDatabase, private http: Http, private cdRef: ChangeDetectorRef, dialog: MdDialog, public store: Store) {
    console.log('Constructor AppComponent');

    this.dialog = dialog;
    firebase.auth().onAuthStateChanged(user => {
      console.log('onAuthStateChanged');
      // Eingeloggter user
      if (user) {
        // Als erstes Mal (ob verified Email oder nicht juckt mich nicht) emailToRole besorgen
        firebase.database().ref('/emailToRole/').once('value', snapshot => {
          console.log('e2R abfragen...');
          if (snapshot.val()) {
            this.store.setEmailToRole(snapshot.val());
          }
        });

        console.log('1');

        if (!user.emailVerified) {
          console.log('2');
          //Email-Adresse noch nicht verifiziert. Warnung und Button um Email zu versenden, anschließend ausloggen
          const dialogRef = this.dialog.open(DialogComponent, {
            disableClose: true,
            data: {
              titel: 'Email nicht verifiziert',
              text: 'Ihre E-Mail wurde noch nicht verifiziert.<br>Klicken Sie auf den Button, und<br>folgen Sie dem Link in der E-Mail.',
              yesButtonText: 'Ok',
              yesButtonVisible: true,
              noButtonText: 'Email senden',
              noButtonVisible: true
            }
          })
            .afterClosed().subscribe(selection => {
              if (selection) {
                //OK Button geklickt, um Dialog zu schließen -> Ausloggen
              } else {
                //Email senden Button geklickt -> Ebenfalls ausloggen
                //.then und .catch - Behandlung noch n bissel mager, aber funktioniert ja.
                user.sendEmailVerification().then(function () {
                  console.log('Email sent.');
                }).catch(function (error) {
                  console.log('An error happened.');
                });
              }
              afAuth.auth.signOut();
            });

          return;
        }
        this.userId = user.uid;
        // this.kalender.setUserId(this.userId);
        // this.buchungen.setUserId(this.userId);
        this.debugText = 'Eingeloggt als: ' + user.email;
        console.log(this.debugText);

        const emailAsKey = user.email.replace(/\./g, '!');

        //Statt email2Role, was völlig schwachsinnig war, einfach once aus der DB lesen!
        firebase.database().ref('/emailToRole/' + emailAsKey + '/').once('value', snapshot => {
          console.log('email: ' + emailAsKey);
          const value = snapshot.val();
          console.log('userValue: ' + value);

          if (value != null) {
            value.email = user.email;
            this.user = value;
            this.store.eUser = value;

            this.content = 'overview';

            this.userAdmin = true; //snapshot.val()['admin'];
            this.userParkId = value['parkId'];
            this.debugText = 'this.userParkId=' + this.userParkId;

            if (value['isActive']) {
              console.log('---------- Der User ist aktiv! Alles gut! ----------');
              // this.kalender.setUserRights(this.userParkId, this.userAdmin);
            } else {
              console.log('---------- Der User ist inaktiv! ');
              //Erst ein Dialog mit ner Fehlermeldung, danach ausloggen (wodurch LoginDialog hochkommt)
              const dialogRef = this.dialog.open(DialogComponent, {
                disableClose: true,
                data: {
                  titel: 'Userkonto inaktiv',
                  text: 'Ihr Konto wurde noch nicht aktiviert.<br>Wenden Sie sich an die Hotline.',
                  yesButtonText: 'Ok',
                  yesButtonVisible: true
                }
              })
                .afterClosed().subscribe(selection => {
                  afAuth.auth.signOut();
                });
            }
          }
        });
        this.cdRef.detectChanges();
      }
      //Ausgeloggt...
      else {
        console.log('AAAAAAAAAAAAAAA Login Dialog AAAAAAAAAAAAAAAA');
        //NOCH: Listener abmelden, KalenderView leeren
        const dialogRef = this.dialog.open(LoginComponent, {
          disableClose: true
        });

        dialogRef.componentInstance.setAuth(this.afAuth);
        dialogRef.componentInstance.setSelf(dialogRef);

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
    this.afAuth.auth.signInWithEmailAndPassword(email, pw).catch(function (error) {
      console.log('error from log: ' + error.message);
      this.dialogRef.componentInstance.fb_status = error.message;
      this.cdRef.detectChanges();
    });
  }

  logout() {
    this.afAuth.auth.signOut().then(() => this.user = null);
    this.userParkId = -1;
    this.kalender.userParkId = -1;
    this.userAdmin = false;
    this.kalender.generateTable();
  }

  ngAfterViewInit() {
    firebase.database().ref('/config').once('value').then(v => this.store.setConfig(v.val()));
  }

  // public getVermieter(): firebase.Promise<any> {
  //   console.log('getVermieter()...');
  //   if (!this.vermieterMap) {
  //     console.log('Liegt noch nicht vor...');
  //     const promise = firebase.database().ref('/emailToRole/').orderByChild('parkId').startAt(0).once('value');
  //
  //     //Wir geben erstmal ein Promise zum Selber-auswerten zurück aber gleichzeitig
  //     //brauchen wir ja die vermieterMap sonst wäre ja total dämlich
  //     promise.then((snapshot) => {
  //       console.log('Response von Anfrage in AppComponent: ');
  //       console.log(snapshot.val());
  //       this.vermieterMap = snapshot.val(); //.json;
  //       return this.vermieterMap;
  //     });
  //
  //     return promise;
  //   } else {
  //     //Das müsste ich ja jetzt eigentlich in ein Promise wrappen ... iwie.
  //     console.log('Liegt schon vor...');
  //     return this.vermieterMap;
  //   }
  // }
  //
  // public getMieter(): any {
  //   console.log('getMieter()...');
  //   if (!this.vermieterMap) {
  //     console.log('Liegt noch nicht vor...');
  //     firebase.database().ref('/emailToRole/').orderByChild('parkId').startAt(0).once('value')
  //       .then((snapshot) => {
  //         console.log('Response von Anfrage: ');
  //         console.log(snapshot.val());
  //         this.vermieterMap = snapshot.val(); //.json;
  //         return this.vermieterMap;
  //       });
  //   } else {
  //     console.log('Liegt schon vor...');
  //     return this.vermieterMap;
  //   }
  // }

  setContent(content) {
    this.content = content;
  }

}
