import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {Store} from '../store/store.service';
import {MdDialog, MdSnackBar} from '@angular/material';
import {DialogComponent} from '../dialog/dialog.component';
import {AdminDialogComponent} from '../admin-dialog/admin-dialog.component';
import * as firebase from 'firebase/app';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-verwaltung',
  templateUrl: './verwaltung.component.html',
  styleUrls: ['./verwaltung.component.css']
})
export class VerwaltungComponent implements OnInit {

  userArray=[];  
  vergebeneParkplaetze=[];
  user;

  constructor(private store: Store, private dialog: MdDialog, private snackBar: MdSnackBar, 
    private changeDetector: ChangeDetectorRef, private http: HttpClient) { }

  ngOnInit() {
    this.user = this.store.eUser;
    var e2r = this.store.getEmailToRole();
    var e2rKeys = Object.keys(e2r);

    for (var ek in e2rKeys) {
      var entry = e2r[e2rKeys[ek]];
      this.userArray.push(
        {email: e2rKeys[ek].replace(/!/g,'.'),
          parkId:entry.parkId,
          isActive: entry.isActive,
          benutzerAdmin: entry.benutzerAdmin,
          buchungsAdmin: entry.buchungsAdmin,
          uid: entry.uid});

      if (entry.parkId>0) this.vergebeneParkplaetze.push(entry.parkId);
    }
    this.changeDetector.markForCheck();
  }

  onIsActiveChange(index: number) {
    this.userArray[index].isActive=!this.userArray[index].isActive;
    this.apply(index, {isActive: this.userArray[index].isActive});
  }
  onBuchungChange(index: number) {
    this.userArray[index].buchungsAdmin=!this.userArray[index].buchungsAdmin;
    if (this.userArray[index].buchungsAdmin) {
      this.userArray[index].benutzerAdmin=false;
    }
    this.apply(index,
    {buchungsAdmin: this.userArray[index].buchungsAdmin,
      benutzerAdmin: this.userArray[index].benutzerAdmin});
  }
  onBenutzerChange(index: number) {
    this.userArray[index].benutzerAdmin=!this.userArray[index].benutzerAdmin;
    if (this.userArray[index].benutzerAdmin) {
      this.userArray[index].buchungsAdmin=false;
    }
    this.apply(index,
    {benutzerAdmin: this.userArray[index].benutzerAdmin,
      buchungsAdmin: this.userArray[index].buchungsAdmin});
  }

  apply(index: number, data: any) {
    var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
    ref.update(
      data)
    .then( result => {
      this.store.updateE2R( this.userArray[index].email.replace(/\./g,'!'), data);
    })
    .catch(error => {
      console.log ("ERROR: "+error);
    });
  }

  onDeleteUser(index: number) {
    var email= this.userArray[index].email;
    var uid = this.userArray[index].uid;

    let dialogRef = this.dialog.open(DialogComponent, {
          data:  {
            //controller: this.controller,
            titel: 'Benutzer löschen',
            text:'Sind Sie sicher, dass Sie den User<br>'+email+'<br>wirklich löschen wollen?',
            yesButtonText: 'Ja',
            yesButtonVisible: true,
            noButtonText:'Nein',
            noButtonVisible: true
          }
        });
        dialogRef.afterClosed().subscribe(selection => {
          if (selection) {
            var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
            ref.remove()
            .then( any => {
              this.userArray.splice(index,1);
            });
          }
        });
  }

onParkIdChange(index:number) {
  var value = parseInt((<HTMLInputElement>document.getElementById(""+index)).value);

  
  if (isNaN( value ) || ( value<0 || value>6098)) {
    this.snackBar.open('Bitte geben Sie eine gültige Parkplatz-Nummer ein.', null, {duration: 2000});
    var ersatzWert = (this.userArray[index].parkId);
    if (!ersatzWert) ersatzWert=0;
    (<HTMLInputElement>document.getElementById(""+index)).value = ersatzWert;
    return;
  }

  //Prüfen, ob schon jmd anderes diesen Parkplat hat
  if ( this.vergebeneParkplaetze.indexOf(value)>-1 )
  {
    this.snackBar.open('Dieser Parkplatz ist bereits vergeben.', null, {duration: 3000});
    var ersatzWert = (this.userArray[index].parkId);
    if (!ersatzWert) ersatzWert=0;
    (<HTMLInputElement>document.getElementById(""+index)).value = ersatzWert;
    return;
  }

  //Den bisherigen Wert muss ich noch aus dem Array VergebeneParkplätze herausholen, sonst kann ich den
  //erst nach nem Neustart neu vergeben.
  var oldValue = this.userArray[index].parkId;
  var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
    ref.update( {parkId: value} )
    .then( result => {
      this.snackBar.open('Parkplatz gewechselt von '+ oldValue +' zu '+value, null, {duration: 2000});
      if (value>0) this.vergebeneParkplaetze.push(value);
      if (oldValue>0) this.vergebeneParkplaetze.splice ( this.vergebeneParkplaetze.indexOf(oldValue),1);
      this.store.updateE2R( this.userArray[index].email.replace(/\./g,'!'),  {parkId: value});
      this.userArray[index].parkId=value;
    })
    .catch(error => {
      console.log ("ERROR: "+error);
    });


}

createNewUser() {
  //Dialog aufmachen
  let dialogRef = this.dialog.open(AdminDialogComponent, {
     data:  {
       titel: 'Neuen User anlegen',
       text:'Geben Sie die E-Mail-Adresse des neuen Users an:',
       yesButtonText: 'OK',
       yesButtonVisible: true,
       noButtonText:'Abbrechen',
       noButtonVisible: true
       }
  });
  dialogRef.afterClosed().subscribe(selection => {
    if(selection) {
      var email=dialogRef.componentInstance.getNewEmail().toLowerCase();
      //email validieren: vorhandensein von : @deka.lu, nochwas?
      if ( !( email.includes('@deka.lu') || email.includes('@deka.de') )) {
        //Snackbar mit Fehlermeldung
        this.snackBar.open('Fehler! Geben Sie eine gültige DEKA-E-Mail an.', null, {duration: 2000});
      } else {
        email=this.emailToEmailAsKey(email);

        var newPostRef = firebase.database().ref('/emailToRole/'+email+'/')
        .set({
          benutzerAdmin: false,
          buchungsAdmin: false,
          isActive: false,
          parkId: 0,
          uid: "not set yet"
        }).then(data=>{
          this.snackBar.open('User erfolgreich angelegt.', null, {duration: 2000});
          var newUser={email: email.replace(/!/g,'.'),
            parkId:0,
            isActive:false,
            benutzerAdmin: false,
            buchungsAdmin: false,
            uid: "not set yet"
          };
          this.store.pushToE2R(newUser);
          this.userArray.push(newUser);
        });


      }
    }
  });
}

onEmailChanged(i: any) {
  console.log ("onEmailChanged(): "+i);
  console.log (this.userArray[i]);
  //console.log (i);
  var editedEmail = (<HTMLInputElement>document.getElementById(""+i)).value;
  editedEmail=editedEmail.toLowerCase();
  if (this.userArray[i].email != editedEmail) {
    console.log("Email wurde editiert.");
    
    //Erstmal nen Bestätigungsdialog anzeigen.    
    let dialogRef = this.dialog.open(DialogComponent, {
      data:  {
        titel: 'Email ändern',
        text:'Wollen Sie die Email von "'+this.userArray[i].email+'"<br>nach "'+editedEmail+'" ändern?',
        yesButtonText: 'Ja',
        yesButtonVisible: true,
        noButtonText:'Nein',
        noButtonVisible: true
        }
      });
    dialogRef.afterClosed().subscribe(selection => {
      if (selection) {
        //Neuen Knoten unter neuer Email anlegen, alten da rein kopieren        
        if ( !( editedEmail.includes('@deka.lu') || editedEmail.includes('@deka.de') )) {
          //Snackbar mit Fehlermeldung
          this.snackBar.open('Fehler! Geben Sie eine gültige DEKA-E-Mail an.', null, {duration: 2000});
        } else {
          //Neuen Knoten in emailToRole anlegen:
          console.log ('/emailToRole/'+ this.userArray[i].email + ' löschen!');
          var newPostRef = firebase.database().ref('/emailToRole/'+this.emailToEmailAsKey(editedEmail)+'/')
          .set({
            benutzerAdmin: this.userArray[i].benutzerAdmin,
            buchungsAdmin: this.userArray[i].buchungsAdmin,
            isActive: this.userArray[i].isActive,
            parkId: this.userArray[i].parkId,
            uid: this.userArray[i].uid
          })
          .then(res => {
            //Firebase Function um die Email zu ändern aufrufen:
            this.http.get("https://us-central1-"+this.store.getProjectId()+".cloudfunctions.net/updateUserEmail?uid="+this.userArray[i].uid+"&email="+
            editedEmail, {responseType: 'text'})
            .subscribe(data => {
              //Erfolgreich geupdatet->
              //Alten Knoten löschen:
              firebase.database().ref('/emailToRole/'+ this.emailToEmailAsKey( this.userArray[i].email )).remove();
              console.log ('/emailToRole/'+ this.emailToEmailAsKey( this.userArray[i].email ) + ' löschen!');
            
            //Allerdings auch im Store. Alten raus, neuen rein.
            //Und hier im array
            this.userArray.splice(i,1);
            console.log ("Im Store den Key "+this.userArray[i].email + "(oder asKey?) löschen und nen neuen"+
            " Eintrag für "+editedEmail + " anlegen. Mal nochmal gucken, ob das jetzt Keys oder KlartextEmails sind.");            
                          
            }, err => {
              //Abbruch der Verbindung?
              //Meldung und neuen Knoten löschen
              this.snackBar.open("Wechsel der Adresse fehlgeschlagen!", null, {duration: 2000});
              firebase.database().ref('/emailToRole/'+this.emailToEmailAsKey(editedEmail)).remove();
            });

          })
        

        }
      }
    });

  }
}

emailToEmailAsKey(email: string) {  
  email=email.toLowerCase();
  email=email.replace(/ö/g,'oe');
  email=email.replace(/ä/g,'ae');
  email=email.replace(/ü/g,'ue');
  email=email.replace(/ß/g,'ss');

  email=email.replace(/\./g,'!');
  return email;  
}
}
