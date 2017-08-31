import { Component, OnInit } from '@angular/core';
import * as firebase from 'firebase/app';
//import * as moment from 'moment';
import {Store} from '../store/store.service';

@Component({
  selector: 'app-verwaltung',
  templateUrl: './verwaltung.component.html',
  styleUrls: ['./verwaltung.component.css']
})
export class VerwaltungComponent implements OnInit {

  userArray=[];
  constructor(private store: Store) { }

  ngOnInit() {
    console.log("Verwaltung OnInit");
    var e2r = this.store.getEmailToRole();
    var e2rKeys = Object.keys(e2r);

    for (var ek in e2rKeys) {
      var entry = e2r[e2rKeys[ek]];
      console.log ("ENTRY: "+entry);
      this.userArray.push( 
        {email: e2rKeys[ek].replace(/!/g,'.'), parkId:entry.parkId, 
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
    //To Do: Der Apply-Button muss das auch im Store updaten!
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
    var email= this.userArray[index].email.replace(/\./g,'!');
    console.log ("User "+email +"("+this.userArray[index].uid+") soll gelöscht werden.");
    
  }
}
