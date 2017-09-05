import {AfterViewChecked, ChangeDetectorRef, Component, ViewChild} from '@angular/core';

import {MdDialog, MdSidenav} from '@angular/material';
import {DialogComponent} from './dialog/dialog.component';
import {Store} from './store/store.service';

declare var firebase: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements AfterViewChecked {
  dialog: MdDialog;
  content = 'login';

  user;
  title = 'app';
  userId: string;
  userParkId = 0;
  debugText = 'debugText';

  @ViewChild(MdSidenav)
  private sidenav: MdSidenav;

  ngAfterViewChecked(): void {
  }

  constructor(private cdRef: ChangeDetectorRef, dialog: MdDialog, public store: Store) {
    console.log('Constructor AppComponent');

    this.dialog = dialog;
    firebase.auth().onAuthStateChanged(user => {
      console.log('onAuthStateChanged');
      if (user) {
        firebase.database().ref('/config').once('value').then(v => this.store.setConfig(v.val()));
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
              firebase.auth().signOut();
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
                  firebase.auth().signOut();
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
    firebase.auth().signInWithEmailAndPassword(email, pw).catch(function (error) {
      console.log('error from log: ' + error.message);
      this.dialogRef.componentInstance.fb_status = error.message;
      this.cdRef.detectChanges();
    });
  }

  logout() {
    firebase.auth().signOut().then(() => this.user = null);
    this.userParkId = -1;
  }

  setContent(content) {
    this.content = content;
    this.sidenav.close();
  }

}
