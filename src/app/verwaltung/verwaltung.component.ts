import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {Store} from '../store/store.service';
import {MdDialog, MdSnackBar} from '@angular/material';
import {DialogComponent} from '../dialog/dialog.component';
import {AdminDialogComponent} from '../admin-dialog/admin-dialog.component';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-verwaltung',
  templateUrl: './verwaltung.component.html',
  styleUrls: ['./verwaltung.component.css']
})
export class VerwaltungComponent implements OnInit {

  userArray=[];
  //availableSpaces=['Kein Parkplatz',1, 15, 123, 310];
  vergebeneParkplaetze=[];
  user;

  constructor(private store: Store, private dialog: MdDialog, private snackBar: MdSnackBar, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {

    console.log("Verwaltung OnInit");
    this.user = this.store.eUser;
    console.log (this.user.benutzerAdmin, this.user.buchungsAdmin);



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
    console.log ("Apply ... "+this.userArray[index].isActive,
        this.userArray[index].benutzerAdmin,
        this.userArray[index].buchungsAdmin);
    var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
    ref.update(
      data)
    .then( result => {
      console.log ("Hat geklappt!");
      this.store.updateE2R( this.userArray[index].email.replace(/\./g,'!'), data);
    })
    .catch(error => {
      console.log ("ERROR: "+error);
    });
  }

  onDeleteUser(index: number) {
    var email= this.userArray[index].email;
    var uid = this.userArray[index].uid;
    console.log ("User "+email +"("+this.userArray[index].uid+") soll gelöscht werden.");

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
            console.log ("LÖSCHEN!");
            var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
            ref.remove()
            .then( any => {
              console.log("remove-then:");
              this.userArray.splice(index,1);
            });


          }
        });
  }

//Ab hier Funktionen für Buchungsverwalter

//kann in der aktuellen minimal-lösung auch weg
onParkIdClick(index: number) {
  //Leider n bissel umständlich, weil ich die Werte nicht unmittelbar binden will, sondern
  //erstmal auf Plausibilität checke, ob keine Werte doppelt vergeben werden.

  // let dialogRef = this.dialog.open(SelectDialogComponent, {
  //   data:  {
  //     titel: 'Parkplatz zuweisen',
  //     text:'Wählen Sie den Parkplatz aus der Liste:',
  //     availableSpaces: this.availableSpaces,
  //     yesButtonText: 'OK',
  //     yesButtonVisible: true,
  //     noButtonText:'Abbrechen',
  //     noButtonVisible: true,
  //     callback: this.dialogCallback,
  //     scope: this,
  //     indexOfUser: index
  //     }
  // });

/*
  var value = parseInt((<HTMLInputElement>document.getElementById(""+index)).value);
  console.log ("ParkId of #"+index+" changed to "+value);

  if (isNaN( value )) {
    this.snackBar.open('Bitte geben Sie eine gültige Parkplatz-Nummer ein.', null, {duration: 2000});
    return;
  }

  this.snackBar.open('Parkplatz gewechselt zu '+value, null, {duration: 2000});
  */
}

/*
dialogCallback(value: any, indexOfUser: number) {
  console.log ("Callback! Selected Value:"+value+ "   indexOfUser:"+indexOfUser);

  console.log("Index im available Spaces: "+this.availableSpaces.indexOf(value));

  console.log ("Alter Wert des Users: ");
  console.log(this.userArray[indexOfUser]);//.parkId);

  var alterWert = this.userArray[indexOfUser].parkId;
  if ( alterWert > 0 ) {
    //in dem Fall können alter und neuer Wert einfach geswapped werden
  }

  //hier soll geschehen: der betreffende user kriegt sinene neuen wert
  //der neue wert verlässt das availbale spaces arra<, dafür kommt
  //der alte wert (falls vorhanden) dazu.

}
//kann weg, wenn ich keine md-selct verwende
onSelectOptionChange(event: any, user_index: number) {
  console.log("OSOC: "+event['value'] + "@"+user_index);
  var value_index = this.availableSpaces.findIndex(event['value']);
  this.availableSpaces.splice(value_index,1);
  this.userArray[user_index]=event['value'];

}
*/
onParkIdChange(index:number) {
  console.log(this.vergebeneParkplaetze);
  var value = parseInt((<HTMLInputElement>document.getElementById(""+index)).value);
  console.log ("ParkId of #"+index+" changed to "+value);

  //Dummy Wert 400 für maxParkplatzId
  if (isNaN( value ) || ( value<0 || value>400)) {
    this.snackBar.open('Bitte geben Sie eine gültige Parkplatz-Nummer ein.', null, {duration: 2000});
    (<HTMLInputElement>document.getElementById(""+index)).value = this.userArray[index].parkId;
    return;
  }

  //Prüfen, ob schon jmd anderes diesen Parkplat hat
  if ( this.vergebeneParkplaetze.indexOf(value)>-1 )
  {
    this.snackBar.open('Dieser Parkplatz ist bereits vergeben.', null, {duration: 2000});
    (<HTMLInputElement>document.getElementById(""+index)).value = this.userArray[index].parkId;
    return;
  }

  var ref = firebase.database().ref('/emailToRole/'+this.userArray[index].email.replace(/\./g,'!'));
    ref.update( {parkId: value} )
    .then( result => {
      this.snackBar.open('Parkplatz gewechselt zu '+value, null, {duration: 2000});
      if (value>0) this.vergebeneParkplaetze.push(value);
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
      if ( !email.includes('@deka.lu') ) {
        //Snackbar mit Fehlermeldung
        this.snackBar.open('Fehler! Geben Sie eine gültige DEKA-E-Mail an.', null, {duration: 2000});
      } else {
        email=email.replace(/ö/g,'oe');
        email=email.replace(/ä/g,'oe');
        email=email.replace(/ü/g,'ue');
        email=email.replace(/ß/g,'ss');

        email=email.replace(/\./g,'!');
        console.log ("Erstelle neuen Knoten: /emailToRole/"+email);

        var newPostRef = firebase.database().ref('/emailToRole/'+email+'/')
        .set({
          benutzerAdmin: false,
          buchungsAdmin: false,
          isActive: false,
          parkId: 0,
          uid: "overwrite me!"
        }).then(data=>{
          this.snackBar.open('User erfolgreich angelegt.', null, {duration: 2000});
        });
        var newUser={email: email,
          parkId:0,
          isActive:false,
          benutzerAdmin: false,
          buchungsAdmin: false,
          uid: "overwrite me!"
        };
        this.store.pushToE2R(newUser);
        this.userArray.push(newUser);

      }
    }
  });
}
}
