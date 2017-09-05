import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import * as moment from 'moment';
import {Store} from '../store/store.service';
import {ParkConst} from "../util/const";

declare var firebase: any;

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

  constructor(private store: Store) {
  }

  ngOnDestroy(): void {
    this.query.off();
  }

  ngOnInit() {
    this.datum = moment().year(this.day.year).dayOfYear(this.day.dayOfYear).format('DD.MM.YYYY');

    this.ref = firebase.database().ref(ParkConst.BUCHUNGEN_PFAD).child(String(this.day.year)).child(String(this.day.dayOfYear));
    this.query = this.ref.orderByChild('mId').equalTo(null);
    this.query.on('value', snapshot => {
      const value = snapshot.val();
      if (value != null) {
        console.log('v: ' + JSON.stringify(value));
        Object.keys(value).forEach(k => {
          const v = value[k];
          this.slots.push({key: k, pId: v.pId});
        });

        this.chunks = this.chunk(this.slots, 5);
      }
    });
  }

  chunk = (list, size) => {
    const res = [];

    while (list.length) {
      res.push(list.splice(0, size));
    }
    const last = res[res.length - 1];

    console.log('last: ' + JSON.stringify(last));
    console.log('length: ' + last.length);
    console.log('size: ' + size);

    if (last.length < size) {
      const n = size - last.length;
      for (let i = 0; i < n; i++) {
        last.push({pId: 0});
      }
    }

    console.log('last2: ' + JSON.stringify(last));

    return res;
  }

  slotClick(slot) {
    this.ref.child(slot.key).update({
      'mId': this.store.oververviewUser.uid
    });

    this.close();
  }

  close() {
    this.onClose.emit();
  }

}
