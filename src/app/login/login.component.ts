import {AfterViewChecked, Component, ChangeDetectorRef, NgZone} from '@angular/core';
import * as firebase from 'firebase';
import {HttpClient} from '@angular/common/http';
import {MdDialog} from '@angular/material';
import {TextInputDialogComponent} from '../text-input-dialog/text-input-dialog.component';
import {Store} from '../store/store.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewChecked{
  innerHtmlString = '';
  user_email = '';
  user_password = '';

  ngAfterViewChecked(): void {
  }

  constructor(private http: HttpClient, private dialog: MdDialog, private cdRef: ChangeDetectorRef, private ngZone: NgZone, private store: Store) {}

  login() {
    this.user_email=this.user_email.toLowerCase();
    firebase.auth().signInWithEmailAndPassword(this.user_email, this.user_password)
      .then((promise: any) => {
        this.innerHtmlString = 'Erfolgreich angemeldet.';
      })
      .catch((error: any) => {
        console.log('LoginComponent Error ' + error.message);
        this.innerHtmlString = error.message;
      });
  }

  register() {
    this.user_email=this.user_email.toLowerCase();
    /*Bevor der Prozess angestoßen wird, gucken ob
      - das PW den DEKA Richtlinien entspricht
      - und ob bereits Daten für diese Email in der DB stehen
      Erst dann der API Call! Im FirebaseFunctions-Listener wird die uid auf den richtigen Wert gesetzt!
    */
      this.innerHtmlString="";
      //Überprüft das Passwort auf DEKA-Konformität
      const kleinBS = /[a-z]/;
      const grossBS = /[A-Z]/;
      const ziffern = /[0-9]/;
      const sonderz = /\W/;

      var zeichenTypenUsed=0;

      if (kleinBS.test(this.user_password)) zeichenTypenUsed++;
      if (grossBS.test(this.user_password)) zeichenTypenUsed++;
      if (ziffern.test(this.user_password)) zeichenTypenUsed++;
      if (sonderz.test(this.user_password)) zeichenTypenUsed++;

      if (! (this.user_password.length>=10 && zeichenTypenUsed>=3) ) {
        this.innerHtmlString = 'Das eingegebene Passwort entspricht nicht den Passwortrichtlinien! Verwenden Sie min. 10 Zeichen, darin<br>Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen.';
        return;
      }



    //Funktion schickt als HTTP-Response nen String zurück. Weiß nicht wie klug/dumm das ist...
    this.http.get('https://us-central1-'+this.store.getProjectId()+'.cloudfunctions.net/b3isUserAlreadyInDB?email=' + this.user_email, {responseType: 'text'}).subscribe(data => {

      //Falls es die Register-Email (noch) nicht in emailToRole gibt:
      if (data === 'false') {
        this.innerHtmlString = 'Ihre Email-Adresse wurde nicht gefunden.<br>Wenden Sie sich an <a href="mailto:serviceundlogistik_luxemburg@deka.lu">Service und Logistik</a>.';
      }

      if (data === 'true') {
        //Jetzt muss man noch unterscheiden, ob die Email zum ersten Mal in Auth registriert wird,
        //oder ob sich ein bereits registrierter aus Versehen erneut registrieren will:

        //Ich schätze mal, da wird ne Fehlermeldung zurückkommen, wenn es den User schon gibt.
        firebase.auth().createUserWithEmailAndPassword(this.user_email, this.user_password)
          .then(data => {
            //Registrierung hat geklappt! data entspricht glaube ich nem firebase.user Objekt
            //Dummerweise wird der User auch gleich eingeloggt.
            this.innerHtmlString = 'Sie haben sich erfolgreich registriert!';
          })
          .catch(error => {
            console.log('error : ' + error);
            this.innerHtmlString = error.message;
          });
      }
    });
  }

  onPasswordReset() {
    //Dialog mit Eingabemaske für Passwort einblenden und n Button zum Bestätigen. Und halt n Infotext.
  this.ngZone.run(() => {
    const dialogRef = this.dialog.open(TextInputDialogComponent, {
      disableClose: true, //könnte eigentlich auch false
      data: {
        titel: 'Passwort zurücksetzen',
        html: 'Geben Sie Ihre E-Mail-Adresse an,<br>an die der Reset-Link geschickt wird:<p></p>',
        email: this.user_email
      }
    });
    dialogRef.afterClosed().subscribe(selection => {
        if (!selection) {
          //Abbruch Button geklickt, um Dialog zu schließen
        } else {
          //Email senden Button geklickt
          this.user_email=dialogRef.componentInstance.user_email;
          //.then und .catch - Behandlung noch n bissel mager, aber funktioniert ja.
          const auth = firebase.auth();
          auth.sendPasswordResetEmail(this.user_email).then(function () {
            // Email sent.
          }).catch(function (error) {
            console.log('error beim versenden der pw reset email');
            console.log (error.message);
          });
        }
        this.cdRef.detectChanges();
      });
  });
}

onTabChanged() {
  this.innerHtmlString="";
  this.cdRef.detectChanges();
}
}
