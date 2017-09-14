import {AfterViewChecked, ChangeDetectorRef, Component, NgZone, ViewChild} from '@angular/core';

import {MdDialog, MdSidenav} from '@angular/material';
import {DialogComponent} from './dialog/dialog.component';
import {Store} from './store/store.service';

import * as firebase from 'firebase/app';
import {FirebaseApp} from "angularfire2";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements AfterViewChecked {
  content = 'login';

  user;
  title = 'app';
  userId: string;
  debugText = 'debugText';
  window = window;

  app: FirebaseApp;

  @ViewChild(MdSidenav)
  private sidenav: MdSidenav;

  ngAfterViewChecked(): void {
  }

  constructor(private cdRef: ChangeDetectorRef, public dialog: MdDialog, public store: Store, private ngZone: NgZone) {
    ngZone.runOutsideAngular(() => {
      this.app = firebase.initializeApp({
        apiKey: 'AIzaSyCLHo_GBE6DsfCElOiJaIFsEpehmX9H3sE',
        authDomain: 'parkplatztool.firebaseapp.com',
        databaseURL: 'https://parkplatztool.firebaseio.com',
        projectId: 'parkplatztool',
        storageBucket: 'parkplatztool.appspot.com',
        messagingSenderId: '110161579432'
      });
    });

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        firebase.database().ref('/config').once('value').then(v => this.store.setConfig(v.val()));
        firebase.database().ref('/emailToRole/').once('value', snapshot => {
          if (snapshot.val()) {
            this.store.setEmailToRole(snapshot.val());
          }
        });
        if (!user.emailVerified) {
          ngZone.run(() => {
            this.dialog.open(DialogComponent, {
              disableClose: true,
              data: {
                titel: 'Email nicht verifiziert',
                text: 'Ihre E-Mail wurde noch nicht verifiziert.<br>Klicken Sie auf "Email senden" und<br>folgen Sie dem Link in der E-Mail.',
                yesButtonText: 'Logout',
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
                }).catch(function (error) {
                  console.log('An error happened.');
                });
              }
              this.logout();
            });
          });
        } else {
          this.userId = user.uid;
          this.debugText = 'Eingeloggt als: ' + user.email;

          const emailAsKey = user.email.replace(/\./g, '!');

          firebase.database().ref('/emailToRole/' + emailAsKey + '/').once('value', snapshot => {
            const value = snapshot.val();

            if (value != null) {
              if (value['isActive']) {
                value.email = user.email;
                this.user = value;
                this.store.eUser = value;
                this.content = 'overview';
                this.cdRef.detectChanges();
              } else {
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
                    this.logout();
                  });
              }
            }
          });
          // this.cdRef.detectChanges();
        }
      } else {
        // Ausgeloggt...
        this.user = null;
        cdRef.detectChanges();
      }
    });
  }


  login(email: string, pw: string) {
    firebase.auth().signInWithEmailAndPassword(email, pw).catch(function (error) {
      this.dialogRef.componentInstance.fb_status = error.message;
    });
  }

  logout() {
    firebase.auth().signOut();
  }

  setContent(content) {
    this.content = content;
    this.ngZone.run(() => this.sidenav.close());
  }

}
