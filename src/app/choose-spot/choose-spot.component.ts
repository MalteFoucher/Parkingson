import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import {Store} from '../store/store.service';

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

  private query: firebase.database.Query;
  private ref: firebase.database.Reference;

  constructor(private store: Store) {
  }

  ngOnDestroy(): void {
    this.query.off();
  }

  ngOnInit() {
    this.datum = moment().year(this.day.year).dayOfYear(this.day.dayOfYear).format('DD.MM.YYYY');

    this.ref = firebase.database().ref('/buchungen3').child(String(this.day.year)).child(String(this.day.dayOfYear));
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

    return res;
  }

  slotClick(slot) {
    this.ref.child(slot.key).update({
      'mId': this.store.user.uid
    });

    this.close();
  }

  close() {
    this.onClose.emit();
  }
}
