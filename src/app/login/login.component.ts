import {Component, Output, EventEmitter} from '@angular/core';
import {AppComponent} from '../app.component';
import {AngularFireAuth} from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import {HttpClient} from '@angular/common/http';
//import { HttpModule } from '@angular/http';
import {MdDialog, MdDialogRef} from '@angular/material';
import {TextInputDialogComponent} from '../text-input-dialog/text-input-dialog.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
  //providers: [AppComponent]
})
export class LoginComponent {
  // innerHtmlString = '[Leer], [Leer] zum Anmelden mit Adminrechten.';
  innerHtmlString = '';
  success = false;
  user_email = '';
  user_password = '';
  parentApp: AppComponent;
  auth: AngularFireAuth;
  self: MdDialogRef<LoginComponent>;
  dialog: MdDialog;

  constructor(private afAuth: AngularFireAuth, private http: HttpClient, dialog: MdDialog) {
    this.auth = afAuth;
    this.dialog = dialog;
  }

  setAuth(auth: AngularFireAuth) {
    this.auth = auth;
  }

  setSelf(self: MdDialogRef<LoginComponent>) {
    //Verweis auf sich selbst, damit er auf sich selbst .close aufrufen kann...!?
    this.self = self;
  }

  /*@Output()
  loginClicked:EventEmitter<string> = new EventEmitter();
  @Output()
  registerClicked:EventEmitter<string> = new EventEmitter();

  triggerLoginEvent() {
    this.loginClicked.emit('unnötig');
  }
  */
  login() {

    //Natürlich nur vorläufig!
    // if (this.user_email === '' && this.user_password === '') {
    //   this.user_email = 'malte_kun@web.de';
    //   this.user_password = 'qweasd';
    // }

    this.auth.auth.signInWithEmailAndPassword(this.user_email, this.user_password)
      .then((promise: any) => {
        this.innerHtmlString = 'Erfolgreich angemeldet.';
        this.success = true;
        this.self.close();
      })
      .catch((error: any) => {
        console.log('LoginComponent Error ' + error.message);
        this.innerHtmlString = error.message;
      });
  }

  register() {
    /*Bevor der Prozess angestoßen wird, gucken ob
      - die Email deka.lu enthält
      - das PW den DEKA Richtlinien entspricht
      - und ob bereits Daten für diese Email in der DB stehen
      Erst dann der API Call! Im FirebaseFunctions-Listener wird die uid auf den richtigen Wert gesetzt!
    */
    console.log('Register:');
    console.log(this.user_email, this.user_password);
    if (this.user_email.endsWith('deka.lu')) {
      this.innerHtmlString = 'Bitte verwenden Sie Ihre DEKA E-Mail.';
      //return;
    }
    //Um PW-Richtlinien zu prüfen, gibts vielleicht iwas mit RegEx?

    //Funktion schickt als HTTP-Response nen String zurück. Weiß nicht wie klug/dumm das ist...
    this.http.get('https://us-central1-parkingtool-6cf77.cloudfunctions.net/b3isUserAlreadyInDB?email=' + this.user_email, {responseType: 'text'}).subscribe(data => {

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
            console.log('then data: ' + data);
            console.log(Object.keys(data));
            console.log(data.uid);
            this.success = true;
            this.innerHtmlString = 'Sie haben sich erfolgreich registriert!';
            //Im AuthState-Listener wird jetzt das Active-Flag abgefragen
            this.self.close();


          })
          .catch(error => {
            console.log('error : ' + error);
            this.innerHtmlString = error.message;
          });
      }
    });
  }

  onPasswordReset() {
    console.log('OPR:');
    //Dialog mit Eingabemaske für Passwort einblenden und n Button zum Bestätigen. Und halt n Infotext.

    const dialogRef = this.dialog.open(TextInputDialogComponent, {
      disableClose: true, //könnte eigentlich auch false
      data: {
        titel: 'Passwort zurücksetzen',
        html: 'Geben Sie Ihre E-Mail-Adresse an,<br>an die der Reset-Link geschickt wird:<p></p>',
        email: this.user_email
      }
    })
      .afterClosed().subscribe(selection => {
        if (!selection) {
          //Abbruch Button geklickt, um Dialog zu schließen
        } else {
          //Email senden Button geklickt
          //.then und .catch - Behandlung noch n bissel mager, aber funktioniert ja.
          const auth = firebase.auth();
          auth.sendPasswordResetEmail(this.user_email).then(function () {
            // Email sent.
            console.log('pw reset email sent');
          }).catch(function (error) {
            console.log('error beim versenden der pw reset email');
          });
        }
      });
  }
}
