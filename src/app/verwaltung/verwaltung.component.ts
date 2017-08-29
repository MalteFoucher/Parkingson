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
    var e2r = this.store.getEmailToRole();
    var e2rKeys = Object.keys(e2r);

    for (var ek in e2rKeys) {
      var entry = e2r[e2rKeys[ek]];
      console.log ("ENTRY: "+entry);
      this.userArray.push( {email: "m", parkId:"p"});
    }
  }
}
