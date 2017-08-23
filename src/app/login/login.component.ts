import { Component, Output, EventEmitter} from '@angular/core';
import { AppComponent } from '../app.component';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
  //providers: [AppComponent]
})
export class LoginComponent {
  success: boolean = false;
  user_email: string="";
  user_password: string="";
  fb_status: string = "[Leer], [Leer] zum Anmelden mit Adminrechten.";
  parentApp: AppComponent;
  auth: AngularFireAuth;

  constructor(public afAuth: AngularFireAuth) {     
    this.auth=afAuth;
  }
  
  setAuth(auth: AngularFireAuth) {
    this.auth = auth;
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
    
    if (this.user_email=="" && this.user_password=="") {
      this.user_email="123@abc.de";
      this.user_password="AbcGuy123";
    }
    this.auth.auth.signInWithEmailAndPassword(this.user_email, this.user_password)
    .then ((promise: any) => {      
      this.fb_status="Erfolgreich angemeldet."
      this.success=true;

    })
    .catch((error: any) => {
      console.log("LoginComponent Error "+error.message);
      this.fb_status=error.message;
    });
  }

  register() {}
}
