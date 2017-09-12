import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import * as moment from 'moment';
import {Store} from '../store/store.service';
import {ParkConst} from "../util/const";

import * as firebase from 'firebase/app';
import {createChangeDetectorRef} from "@angular/core/src/view/refs";
import {MdSnackBar} from "@angular/material";

@Component({
  selector: 'app-choose-spot',
  templateUrl: './choose-spot.component.html',
  styleUrls: ['./choose-spot.component.css']
})
export class ChooseSpotComponent implements OnInit, OnDestroy {
  @Input()
  day;

  @Output()
  onClose = new EventEmitter();

  datum;

  slots = [];
  chunks;

  private query;
  private ref;

  constructor(private store: Store, private cdRef: ChangeDetectorRef, private snachBar: MdSnackBar) {
  }

  ngOnDestroy(): void {
    this.query.off();
  }

  ngOnInit() {
    this.datum = moment().year(this.day.year).dayOfYear(this.day.dayOfYear).format('DD.MM.YYYY');

    this.ref = firebase.database().ref(ParkConst.BUCHUNGEN_PFAD).child(String(this.day.year)).child(String(this.day.dayOfYear));
    this.query = this.ref.orderByChild('mId').equalTo(null);
    this.query.on('value', snapshot => {
      console.log('snapshot: ' + snapshot);
      const value = snapshot.val();
      console.log('value: ' + value);
      if (value != null) {
        console.log('v: ' + JSON.stringify(value));
        Object.keys(value).forEach(k => {
          const v = value[k];
          this.slots.push({key: k, pId: v.pId});
        });
        this.chunks = this.chunk(this.slots, 5);
      } else {
        this.chunks = null;
      }
      this.cdRef.detectChanges();
    });
  }

  chunk = (list, size) => {
    const res = [];

    while (list.length) {
      res.push(list.splice(0, size));
    }
    const last = res[res.length - 1];

    if (last.length < size) {
      const n = size - last.length;
      for (let i = 0; i < n; i++) {
        last.push({pId: 0});
      }
    }
    return res;
  }

  slotClick(slot) {
    this.ref.child(slot.key).child('mId').transaction((mId) => {
      if (mId === null) {
        this.close();
        return this.store.oververviewUser.uid;
      } else {
        this.snachBar.open('Der Parkplatz ist schon vergeben.', null, {duration: 2000});
      }
    });

    // this.ref.child(slot.key).update({
    //   'mId': this.store.oververviewUser.uid
    // });


  }

  close() {
    this.onClose.emit();
  }

}
