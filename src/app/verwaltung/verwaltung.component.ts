import { Component, OnInit } from '@angular/core';
import * as firebase from 'firebase/app';
//import * as moment from 'moment';
import {Store} from '../store/store.service';
import { MdDialog } from '@angular/material';
import { DialogComponent } from '../dialog/dialog.component';
//import { EmailService } from '../email.service';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-verwaltung',
  templateUrl: './verwaltung.component.html',
  styleUrls: ['./verwaltung.component.css']
})
export class VerwaltungComponent implements OnInit {

  userArray=[];
  availableSpaces=[1, 15, 123, 310];
  user;
  
  constructor(private store: Store, private dialog: MdDialog, private http: HttpClient) { }

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
    }
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

onParkIdChange(index: number) {
  console.log ("Park Id "+index+" changed:");
  console.log (this.userArray[index].parkId);
  //Muss man hier noch validieren! Ne Nummer von 1- ??? und noch nicht vergeben?
  //var newNumber = 
  if (isNaN(this.userArray[index].parkId)) {
    console.log("Keine Nummer");
  }

}

onSelectOptionChange(event: any) {
  console.log("OSOC:"+Object.keys(event));
  console.log (event["source"], event["value"] );
}

}
