import {Component, ViewChild, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable} from 'angularfire2/database';
import {AngularFireAuth} from 'angularfire2/auth';
import {Observable} from 'rxjs/Observable';
import * as firebase from 'firebase/app';

import {MdButtonModule, MdDialog, MdDialogRef, MdSidenav} from '@angular/material';
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
  // dialogRef: MdDialogRef;

  content = 'login';

  user;
  title = 'app';
  userId: string;
  userParkId = 0;
  debugText = 'debugText';

  @ViewChild(MdSidenav)
  private sidenav: MdSidenav;


  constructor(public afAuth: AngularFireAuth, public af: AngularFireDatabase, private http: Http,
              private cdRef: ChangeDetectorRef, dialog: MdDialog, public store: Store) {
    console.log('Constructor AppComponent');

    this.dialog = dialog;
    firebase.auth().onAuthStateChanged(user => {
      console.log('onAuthStateChanged');
      if (user) {
        firebase.database().ref('/emailToRole/').once('value', snapshot => {
          console.log('e2R abfragen...');
          if (snapshot.val()) {
            this.store.setEmailToRole(snapshot.val());
          }
        });
        if (!user.emailVerified) {
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
                // OK Button geklickt, um Dialog zu schließen -> Ausloggen
              } else {
                // Email senden Button geklickt -> Ebenfalls ausloggen
                // .then und .catch - Behandlung noch n bissel mager, aber funktioniert ja.
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
        this.debugText = 'Eingeloggt als: ' + user.email;
        console.log(this.debugText);

        const emailAsKey = user.email.replace(/\./g, '!');

        firebase.database().ref('/emailToRole/' + emailAsKey + '/').once('value', snapshot => {
          const value = snapshot.val();

          if (value != null) {
            value.email = user.email;
            this.user = value;
            this.store.eUser = value;

            this.content = 'overview';

            //this.userBenutzerAdmin = value.benutzerAdmin;
            //this.userBuchungsAdmin = value.buchungsAdmin;
            this.userParkId = value['parkId'];
            this.debugText = 'this.userParkId=' + this.userParkId;

            if (value['isActive']) {
              console.log('---------- Der User ist aktiv! Alles gut! ----------');
              // this.kalender.setUserRights(this.userParkId, this.userAdmin);
            } else {
              console.log('---------- Der User ist inaktiv! ');
              // Erst ein Dialog mit ner Fehlermeldung, danach ausloggen (wodurch LoginDialog hochkommt)
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
      } else {
        // Ausgeloggt...
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
    // this.kalender.userParkId = -1;
    //this.userAdmin = false;
    // this.kalender.generateTable();
  }

  ngAfterViewInit() {
    firebase.database().ref('/config').once('value').then(v => this.store.setConfig(v.val()));
  }

  setContent(content) {
    this.content = content;
    this.sidenav.close();
  }

}
